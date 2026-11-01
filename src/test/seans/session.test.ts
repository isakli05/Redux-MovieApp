/**
 * Seans oturum kalıntıları — kısa geçmiş (localStorage) ve kısıt gevşetme.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyLoosen,
  clearHistory,
  loadHistory,
  saveHistoryEntry,
  suggestLoosen,
} from '../../lib/seans/session';
import { windowFromMinutes } from '../../lib/seans/config';
import type { SeansAnswers } from '../../lib/seans/types';

const HISTORY_KEY = 'lmdb:seans:history';

const answers = (p: Partial<SeansAnswers> = {}): SeansAnswers => ({
  kind: 'movie',
  mood: null,
  runtime: 'any',
  genres: [],
  familiarity: null,
  providers: [],
  region: 'TR',
  seed: null,
  ...p,
});

const entry = (key: string, title = key, at = 1_000) => ({ at, title, key });

beforeEach(() => {
  localStorage.clear();
});

describe('seans geçmişi', () => {
  it('saveHistoryEntry/loadHistory gidiş-dönüşü çalışır', () => {
    const saved = saveHistoryEntry(entry('movie:550', 'Fight Club', 42));
    expect(saved).toEqual([{ at: 42, title: 'Fight Club', key: 'movie:550' }]);
    expect(loadHistory()).toEqual(saved);
  });

  it('aynı anahtarı tekilleştirir (tekrar izlenen güncellenir, kopya oluşmaz)', () => {
    saveHistoryEntry(entry('movie:1', 'Eski Başlık', 1));
    saveHistoryEntry(entry('movie:2', 'İkinci', 2));
    const next = saveHistoryEntry(entry('movie:1', 'Yeni Başlık', 3));
    expect(loadHistory()).toHaveLength(2);
    expect(next.find((e) => e.key === 'movie:1')).toEqual({ at: 3, title: 'Yeni Başlık', key: 'movie:1' });
    // Güncellenen kayıt en sona taşınır.
    expect(next[next.length - 1].key).toBe('movie:1');
  });

  it('geçmiş 8 kayıtta sınırlıdır; en eski düşer', () => {
    for (let i = 1; i <= 9; i++) saveHistoryEntry(entry(`movie:${i}`, `Film ${i}`, i));
    const history = loadHistory();
    expect(history).toHaveLength(8);
    expect(history[0].key).toBe('movie:2');
    expect(history[history.length - 1].key).toBe('movie:9');
  });

  it('bozuk JSON boş geçmiş demektir ve kurtarma kaydını bozmaz', () => {
    localStorage.setItem(HISTORY_KEY, '{"broken');
    expect(loadHistory()).toEqual([]);
    localStorage.setItem(HISTORY_KEY, '"42"'); // geçerli JSON ama dizi değil
    expect(loadHistory()).toEqual([]);
    // Bozuk durumdan sonra kayıt atılabilmelidir.
    expect(saveHistoryEntry(entry('movie:7')).find((e) => e.key === 'movie:7')).toBeTruthy();
  });

  it('clearHistory geçmişi boşaltır', () => {
    saveHistoryEntry(entry('movie:1'));
    clearHistory();
    expect(loadHistory()).toEqual([]);
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });
});

describe('kısıt gevşetme', () => {
  it('öneriler hep aynı sırada: servis → süre → tür → ruh hâli → null', () => {
    let a = answers({
      providers: [8],
      runtime: 'short',
      genres: [35],
      mood: 'thrill',
      familiarity: null,
    });
    const patches = [];
    let suggestion = suggestLoosen(a);
    while (suggestion !== null) {
      patches.push(suggestion.patch);
      a = applyLoosen(a, suggestion);
      suggestion = suggestLoosen(a);
    }
    expect(patches).toEqual([
      { providers: [] },
      { runtime: 'any' },
      { genres: [] },
      { mood: null, familiarity: 'familiar' },
    ]);
    expect(suggestLoosen(a)).toBeNull();
  });

  it('ruh hâli adımı familiarity sıfırlamasını da içerir', () => {
    const suggestion = suggestLoosen(
      answers({ providers: [], runtime: 'any', genres: [], mood: 'dark', familiarity: 'adventurous' }),
    );
    expect(suggestion?.patch).toEqual({ mood: null, familiarity: 'familiar' });
  });

  it('sadece familiarity seçiliyken gevşetilecek bir şey yoktur', () => {
    expect(suggestLoosen(answers({ familiarity: 'adventurous' }))).toBeNull();
  });

  it("applyLoosen saf'tır: orijinal cevap nesnesi değişmez", () => {
    const original = answers({ providers: [8], runtime: 'short' });
    const snapshot = structuredClone(original);
    const loosened = applyLoosen(original, suggestLoosen(original));
    expect(loosened).not.toBe(original);
    expect(loosened.providers).toEqual([]);
    expect(original).toEqual(snapshot);
    // Öneri yoksa aynı referans döner.
    const emptied = applyLoosen(original, null);
    expect(emptied).toBe(original);
  });
});

describe('windowFromMinutes', () => {
  it('null/0/negatif süre "any" demektir', () => {
    expect(windowFromMinutes(null, 'movie')).toBe('any');
    expect(windowFromMinutes(0, 'tv')).toBe('any');
    expect(windowFromMinutes(-5, 'movie')).toBe('any');
  });

  it('film ölçeği: 75→kısa, 100→orta, 150→uzun', () => {
    expect(windowFromMinutes(75, 'movie')).toBe('short');
    expect(windowFromMinutes(100, 'movie')).toBe('medium');
    expect(windowFromMinutes(150, 'movie')).toBe('long');
  });

  it('dizi ölçeği: 25→kısa, 40→orta, 50+→uzun (bölüm süresi)', () => {
    expect(windowFromMinutes(25, 'tv')).toBe('short');
    expect(windowFromMinutes(40, 'tv')).toBe('medium');
    expect(windowFromMinutes(50, 'tv')).toBe('long');
    expect(windowFromMinutes(95, 'tv')).toBe('long');
  });
});
