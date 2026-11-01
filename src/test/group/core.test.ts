/**
 * Çekirdek kurallar: skorlama (eşleşme/veto/DNA/beraberlik), hız limiti,
 * kod ve ad üretimi/doğrulaması, kısıt validasyonu.
 */

import { describe, expect, it } from 'vitest';
import {
  CODE_ALPHABET,
  CODE_LEN,
  RATE_MAX_IN_WINDOW,
  RATE_MIN_INTERVAL_MS,
  admitRate,
  computeResult,
  isValidCodeFormat,
  randomCode,
  sanitizeName,
  validateConstraints,
  type Candidate,
  type ParticipantState,
} from '../../lib/group/core';
import { genreIdsFromSummary, loadAnonymousTaste } from '../../lib/group/dna';

function cand(key: string, opts: Partial<Candidate> = {}): Candidate {
  return {
    key,
    kind: 'movie',
    id: Number(key.split(':')[1] ?? 1),
    title: `Film ${key}`,
    posterPath: '/p.jpg',
    year: 2020,
    genreIds: [18],
    voteAverage: 7,
    overview: '',
    ...opts,
  };
}

function voter(pid: string, votes: Record<string, string>, taste: number[] = []): ParticipantState {
  return {
    pid,
    name: pid,
    isHost: false,
    joinedAt: 0,
    lastSeen: 0,
    tasteGenres: taste,
    votes: votes as ParticipantState['votes'],
    rate: [],
  };
}

describe('kod üretimi', () => {
  it('6 haneli ve alfabedeki belirsiz karakterleri içermiyor', () => {
    const banned = /[ILO01]/;
    for (let i = 0; i < 50; i++) {
      const code = randomCode();
      expect(code).toHaveLength(CODE_LEN);
      expect(code).toMatch(new RegExp(`^[${CODE_ALPHABET}]{6}$`));
      expect(code).not.toMatch(banned);
    }
  });

  it('format doğrulaması: geçersiz kodlar reddedilir', () => {
    expect(isValidCodeFormat('ABC234')).toBe(true);
    expect(isValidCodeFormat('abc234')).toBe(false);
    expect(isValidCodeFormat('ABCD')).toBe(false);
    expect(isValidCodeFormat('ABC123')).toBe(false); // 1 belirsiz
    expect(isValidCodeFormat(null)).toBe(false);
  });
});

describe('ad ve kısıt doğrulaması', () => {
  it('ad: kırpılır, kontrol karakterleri atılır, sınır 24', () => {
    expect(sanitizeName('  Deniz  ')).toBe('Deniz');
    expect(sanitizeName('a\u0000b')).toBe('ab');
    expect(sanitizeName('   ')).toBeNull();
    expect(sanitizeName('x'.repeat(25))).toBeNull();
    expect(sanitizeName(42)).toBeNull();
  });

  it('kısıtlar: varsayılan, geçerli ve geçersiz durumlar', () => {
    expect(validateConstraints(undefined)).toEqual({
      mediaType: 'movie', maxRuntime: null, genres: [], region: 'TR', providers: [],
    });
    expect(validateConstraints({ mediaType: 'tv', region: 'US' })).toMatchObject({ mediaType: 'tv', region: 'US' });
    expect(validateConstraints({ mediaType: 'podcast' })).toBeNull();
    expect(validateConstraints({ maxRuntime: 10 })).toBeNull();
    expect(validateConstraints({ genres: [1, 2, 3, 4, 5] })).toBeNull(); // en çok 4
    expect(validateConstraints({ region: 'XX' })).toBeNull();
    expect(validateConstraints('ne')).toBeNull();
  });
});

describe('hız limiti', () => {
  it('ardışık işlemler arası minimum süre ve pencere sınırı', () => {
    const t0 = 1_000_000;
    let d = admitRate([], t0);
    expect(d.ok).toBe(true);
    d = admitRate(d.rate, t0 + RATE_MIN_INTERVAL_MS - 10);
    expect(d.ok).toBe(false); // çok hızlı
    d = admitRate(d.rate, t0 + RATE_MIN_INTERVAL_MS + 10);
    expect(d.ok).toBe(true);
    // pencereyi doldur
    let rate = d.rate;
    for (let i = 1; rate.length < RATE_MAX_IN_WINDOW; i++) {
      const r = admitRate(rate, t0 + RATE_MIN_INTERVAL_MS * (rate.length + 1));
      expect(r.ok).toBe(true);
      rate = r.rate;
    }
    expect(admitRate(rate, t0 + RATE_MIN_INTERVAL_MS * 20).ok).toBe(false);
  });
});

describe('skorlama', () => {
  const now = 5_000;

  it('karşılıklı eşleşme (herkes strong/like) uzlaşının önüne geçer', () => {
    const candidates = [cand('movie:1'), cand('movie:2')];
    const voters = [
      voter('p_a', { 'movie:1': 'like', 'movie:2': 'strong' }),
      voter('p_b', { 'movie:1': 'like', 'movie:2': 'strong' }),
    ];
    const result = computeResult(candidates, voters, now);
    expect(result.reason).toBe('match');
    expect(result.winner?.key).toBe('movie:2'); // ikisi de eşleşme ama puan yüksek olan
    expect(result.winner?.mutual).toBe(true);
  });

  it('eşleşme, eşleşmeyen yüksek puanlı adayı geçer', () => {
    // A: 6 puan ama p_c pas dedi → eşleşme değil. B: 3 puan, herkes like → eşleşme.
    const a = cand('movie:1', { title: 'Puanlı' });
    const b = cand('movie:2', { title: 'Ortak' });
    const voters = [
      voter('p_a', { 'movie:1': 'strong', 'movie:2': 'like' }),
      voter('p_b', { 'movie:1': 'strong', 'movie:2': 'like' }),
      voter('p_c', { 'movie:1': 'skip', 'movie:2': 'like' }),
    ];
    const result = computeResult([a, b], voters, now);
    expect(result.winner?.key).toBe('movie:2');
    expect(result.winner?.mutual).toBe(true);
    expect(result.reason).toBe('match');
  });

  it('veto: veto alan aday sıralamaya giremez, hepsi vetoluysa all_vetoed', () => {
    const candidates = [cand('movie:1'), cand('movie:2')];
    const voters = [voter('p_a', { 'movie:1': 'dislike', 'movie:2': 'dislike' })];
    const result = computeResult(candidates, voters, now);
    expect(result.ranking).toHaveLength(0);
    expect(result.reason).toBe('all_vetoed');
    expect(result.winner).toBeNull();
  });

  it('tek veto yüksek puanlı adayı eler', () => {
    const candidates = [cand('movie:1'), cand('movie:2')];
    const voters = [
      voter('p_a', { 'movie:1': 'strong', 'movie:2': 'like' }),
      voter('p_b', { 'movie:1': 'strong', 'movie:2': 'dislike' }),
    ];
    const result = computeResult(candidates, voters, now);
    expect(result.ranking.map((e) => e.key)).toEqual(['movie:1']);
    expect(result.winner?.key).toBe('movie:1');
  });

  it('DNA özeti kendi oylarını iki katına çıkarır (başkalarını değil)', () => {
    const candidates = [cand('movie:1', { genreIds: [27] })];
    // p_a korku sever (27), p_b değil; ikisi de like
    const voters = [
      voter('p_a', { 'movie:1': 'like' }, [27]),
      voter('p_b', { 'movie:1': 'like' }),
    ];
    const result = computeResult(candidates, voters, now);
    expect(result.winner?.score).toBe(1 * 2 + 1); // a: 1×2, b: 1×1
    expect(result.winner?.boosted).toBe(true);
  });

  it('beraberlikte deterministik sıralama ve tie bayrağı', () => {
    // İki aday da 6 puan, eşit strong/like; p_c ikisini de pas geçti →
    // eşleşme değil, gerçek beraberlik.
    const a = cand('movie:1', { title: 'Alpha' });
    const b = cand('movie:2', { title: 'Beta' });
    const voters = [
      voter('p_a', { 'movie:1': 'strong', 'movie:2': 'strong' }),
      voter('p_b', { 'movie:1': 'strong', 'movie:2': 'strong' }),
      voter('p_c', { 'movie:1': 'skip', 'movie:2': 'skip' }),
    ];
    const result = computeResult([b, a], voters, now);
    expect(result.tie).toBe(true);
    expect(result.reason).toBe('tie');
    // eşitlikte alfabetik (tr) ilk sıradaki
    expect(result.winner?.key).toBe('movie:1');
  });

  it('oy yok → no_votes, kazanan yok', () => {
    const result = computeResult([cand('movie:1')], [voter('p_a', {})], now);
    expect(result.reason).toBe('no_votes');
    expect(result.winner).toBeNull();
  });

  it('herkes pas geçerse kazanan yok', () => {
    const result = computeResult([cand('movie:1')], [voter('p_a', { 'movie:1': 'skip' })], now);
    expect(result.reason).toBe('no_votes');
    expect(result.winner).toBeNull();
  });

  it('oy vermeyen katılımcı eşleşme şartını bozmaz (kendi oyu yok)', () => {
    const candidates = [cand('movie:1')];
    const voters = [
      voter('p_a', { 'movie:1': 'strong' }),
      voter('p_silent', {}), // hiç oy vermedi
    ];
    const result = computeResult(candidates, voters, now);
    expect(result.winner?.mutual).toBe(true);
    expect(result.reason).toBe('match');
  });
});

describe('DNA köprüsü (opsiyonel el teslimi)', () => {
  it('movie:35 anahtarlarından id çıkar; meyile göre ilk 8', () => {
    const summary = {
      version: 1 as const,
      genres: {
        'movie:35': 0.9, 'movie:18': 0.8, 'tv:10759': 0.7, 'movie:27': 0.6,
        'movie:28': 0.5, 'movie:12': 0.4, 'movie:16': 0.3, 'movie:878': 0.2,
        'movie:53': 0.1, // 9. — kesilir
        'movie:x': 1, // bozuk anahtar — atılır
      },
    };
    expect(genreIdsFromSummary(summary)).toEqual([35, 18, 10759, 27, 28, 12, 16, 878]);
  });

  it('DNA modülü bu derlemede yoksa sessizce null döner', async () => {
    expect(await loadAnonymousTaste()).toBeNull();
  });
});
