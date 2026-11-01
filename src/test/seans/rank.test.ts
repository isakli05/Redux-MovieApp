/**
 * Seans rank puanlayıcı — determinizm, gerçek sebepler, hariç tutma.
 * Tüm puanlar ctx.now = Date.UTC(2026, 6, 1) ile sabitlenir (yaz saati
 * kaymalarına karşı yıl ortası; her zaman 2026).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { excludedKeysFromLog, rankPool, scoreCandidate } from '../../lib/seans/rank';
import { listInteractions, logInteraction } from '../../lib/interactions';
import type { Interaction } from '../../lib/interactions';
import type { SeansAnswers, SeansCandidate, SeansContext } from '../../lib/seans/types';

const NOW = Date.UTC(2026, 6, 1); // 2026-07-01T00:00Z → her zaman diliminde yıl 2026

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

const cand = (p: Partial<SeansCandidate> & { id: number }): SeansCandidate => ({
  ref: { kind: p.ref?.kind ?? 'movie', id: p.id, title: p.title ?? `Yapım ${p.id}` },
  title: p.title ?? `Yapım ${p.id}`,
  posterPath: p.posterPath ?? null,
  backdropPath: null,
  voteAverage: p.voteAverage ?? 0,
  voteCount: p.voteCount ?? 0,
  releaseDate: p.releaseDate ?? null,
  genreIds: p.genreIds ?? [],
  popularity: p.popularity ?? 0,
  ...p,
} as SeansCandidate);

const ctx = (p: Partial<SeansContext> = {}): SeansContext => ({
  genreNames: {},
  affinity: { positive: {}, negative: {}, hasData: false },
  providerNames: {},
  now: NOW,
  ...p,
});

beforeEach(() => {
  localStorage.clear();
});

describe('rankPool — determinizm', () => {
  it('aynı girdiyle iki çağrı birebir aynı sıra ve puanları verir', () => {
    const pool = [
      cand({ id: 1, voteAverage: 7.2, voteCount: 400, releaseDate: '2023-01-01' }),
      cand({ id: 2, voteAverage: 8.1, voteCount: 2500, releaseDate: '2001-05-05' }),
      cand({ id: 3, title: 'Aynı Puan', voteAverage: 7, voteCount: 100, releaseDate: '2022-02-02' }),
      cand({ id: 4, title: 'Aynı Puan', voteAverage: 7, voteCount: 100, releaseDate: '2022-02-02' }),
    ];
    const a = rankPool(pool, answers(), ctx(), new Set());
    const b = rankPool(pool, answers(), ctx(), new Set());
    expect(b.map((r) => r.candidate.ref.id)).toEqual(a.map((r) => r.candidate.ref.id));
    expect(b.map((r) => r.score)).toEqual(a.map((r) => r.score));
    for (const r of a) expect(r.score).toBeGreaterThanOrEqual(0);
    for (const r of a) expect(r.score).toBeLessThanOrEqual(100);
  });

  it('eşit puanda Türkçe başlık sırası, sonra id artan belirler', () => {
    // 'Sopa' < 'Şeker' yalnız tr collation'da doğrudur (en'de tersi);
    // dolayısıyla bu sınav localeCompare(..., 'tr') kullanıldığını kanıtlar.
    const pool = [
      cand({ id: 9, title: 'Şeker', voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' }),
      cand({ id: 8, title: 'Sopa', voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' }),
    ];
    const ranked = rankPool(pool, answers(), ctx(), new Set());
    expect(ranked[0].score).toBe(ranked[1].score);
    expect(ranked.map((r) => r.candidate.title)).toEqual(['Sopa', 'Şeker']);

    const sameTitle = rankPool(
      [cand({ id: 5, title: 'Aynı', voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' }),
       cand({ id: 3, title: 'Aynı', voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' })],
      answers(),
      ctx(),
      new Set(),
    );
    expect(sameTitle.map((r) => r.candidate.ref.id)).toEqual([3, 5]);
  });
});

describe('rank — tür uyumu', () => {
  it('seçilen türle eşleşen aday öne geçer ve sebep gerçek tür adını taşır', () => {
    const c = ctx({ genreNames: { 35: 'Komedi', 28: 'Aksiyon' } });
    const a = answers({ genres: [35, 28] });
    const matching = cand({ id: 1, genreIds: [35, 878] });
    const other = cand({ id: 2, genreIds: [16, 99] });
    const ranked = rankPool([other, matching], a, c, new Set());
    expect(ranked[0].candidate.ref.id).toBe(1);
    const genreReason = ranked[0].reasons.find((r) => r.kind === 'genre');
    expect(genreReason?.label).toContain('Komedi');
    expect(ranked[0].reasons.some((r) => r.kind === 'genre')).toBe(true);
    expect(ranked[1].reasons.some((r) => r.kind === 'genre')).toBe(false);
  });
});

describe('rank — süre penceresi sebebi', () => {
  it("runtime 'any' iken süre sebebi yok; pencere seçiliyinde vardır", () => {
    const c = ctx();
    const candidate = cand({ id: 1 });
    const anyReasons = scoreCandidate(candidate, answers({ runtime: 'any' }), c).reasons;
    const shortReasons = scoreCandidate(candidate, answers({ runtime: 'short' }), c).reasons;
    expect(anyReasons.some((r) => r.kind === 'runtime')).toBe(false);
    expect(shortReasons.some((r) => r.kind === 'runtime')).toBe(true);
  });
});

describe('rank — imkânsız kısıtlar', () => {
  it('havuzdaki her aday hariç tutulmuşsa rankPool boş dizi döner', () => {
    const pool = [cand({ id: 1 }), cand({ id: 2 })];
    const excluded = new Set(['movie:1', 'movie:2']);
    expect(rankPool(pool, answers(), ctx(), excluded)).toEqual([]);
  });
});

describe('rank — günlükten hariç tutma', () => {
  it('seen/seans_reject/dislike olayları hedef anahtarlarını hariç listesine koyar', () => {
    logInteraction({ kind: 'seen', target: { kind: 'movie', id: 1 }, source: 'seans' });
    logInteraction({ kind: 'seans_reject', target: { kind: 'movie', id: 2 }, source: 'seans' });
    logInteraction({ kind: 'dislike', target: { kind: 'tv', id: 3 }, source: 'tracker' });
    const excluded = excludedKeysFromLog(listInteractions());
    expect(excluded.has('movie:1')).toBe(true);
    expect(excluded.has('movie:2')).toBe(true);
    expect(excluded.has('tv:3')).toBe(true);
  });

  it('hariç tutulan adaylar düşer; movie:123 ile tv:123 karışmaz', () => {
    const events: Interaction[] = [
      {
        id: 'e1',
        kind: 'seen',
        target: { kind: 'movie', id: 123 },
        at: NOW,
        source: 'seans',
      },
    ];
    const excluded = excludedKeysFromLog(events);
    expect(excluded.has('movie:123')).toBe(true);
    expect(excluded.has('tv:123')).toBe(false);

    const pool = [cand({ id: 123 }), cand({ id: 123, ref: { kind: 'tv', id: 123 } })];
    const ranked = rankPool(pool, answers({ kind: 'tv' }), ctx(), excluded);
    expect(ranked.map((r) => r.candidate.ref.id)).toEqual([123]);
    expect(ranked[0].candidate.ref.kind).toBe('tv');
  });

  it('rankPool izlenenleri listeden çıkarır', () => {
    logInteraction({ kind: 'seen', target: { kind: 'movie', id: 1 }, source: 'seans' });
    logInteraction({ kind: 'seans_reject', target: { kind: 'movie', id: 2 }, source: 'seans' });
    logInteraction({ kind: 'dislike', target: { kind: 'tv', id: 3 }, source: 'tracker' });
    const pool = [
      cand({ id: 1 }),
      cand({ id: 2 }),
      cand({ id: 3, ref: { kind: 'tv', id: 3 } }),
      cand({ id: 4 }),
    ];
    const ranked = rankPool(pool, answers(), ctx(), excludedKeysFromLog(listInteractions()));
    expect(ranked.map((r) => r.candidate.ref.id)).toEqual([4]);
  });
});

describe('rank — zevk akrabalığı', () => {
  it('bilinen sular: pozitif akrabalık puan getirir ve sebep üretir', () => {
    const c = ctx({
      genreNames: { 35: 'Komedi' },
      affinity: { positive: { 35: 2 }, negative: {}, hasData: true },
    });
    const a = answers({ familiarity: 'familiar' });
    const near = cand({ id: 1, genreIds: [35], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const far = cand({ id: 2, genreIds: [99], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const ranked = rankPool([far, near], a, c, new Set());
    expect(ranked[0].candidate.ref.id).toBe(1);
    const taste = ranked[0].reasons.find((r) => r.kind === 'taste');
    expect(taste?.label).toContain('Komedi');
    expect(ranked[1].reasons.some((r) => r.kind === 'taste')).toBe(false);
  });

  it("keşif modu: sıfır akrabalıklı aday öne geçer ve 'novelty' sebebi üretir", () => {
    const c = ctx({
      affinity: { positive: { 35: 3 }, negative: {}, hasData: true },
    });
    const a = answers({ familiarity: 'adventurous' });
    const familiarTaste = cand({ id: 1, genreIds: [35], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const novel = cand({ id: 2, genreIds: [99], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const ranked = rankPool([familiarTaste, novel], a, c, new Set());
    expect(ranked[0].candidate.ref.id).toBe(2);
    expect(ranked[0].reasons.some((r) => r.kind === 'novelty')).toBe(true);
    expect(ranked[1].reasons.some((r) => r.kind === 'novelty')).toBe(false);
  });

  it('sevilmeyen tür −8 ceza uygular ve sıralamayı geriletir', () => {
    const c = ctx({
      affinity: { positive: {}, negative: { 27: 1 }, hasData: true },
    });
    const penalized = cand({ id: 1, genreIds: [27, 35], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const clean = cand({ id: 2, genreIds: [18, 35], voteAverage: 7, voteCount: 100, releaseDate: '2022-01-01' });
    const ranked = rankPool([penalized, clean], answers(), c, new Set());
    expect(ranked[0].candidate.ref.id).toBe(2);
    expect(ranked[1].score).toBe(ranked[0].score - 8);
  });
});

describe('rank — dönem', () => {
  it('son 10 yıl +10 puan ve sebep; 25 yıllık +5 puan sessizce', () => {
    const c = ctx();
    const recent = scoreCandidate(cand({ id: 1, releaseDate: '2020-06-15' }), answers(), c);
    const oldish = scoreCandidate(cand({ id: 2, releaseDate: '2001-03-01' }), answers(), c);
    const ancient = scoreCandidate(cand({ id: 3, releaseDate: '1995-01-01' }), answers(), c);
    expect(recent.reasons.some((r) => r.kind === 'era')).toBe(true);
    expect(oldish.reasons.some((r) => r.kind === 'era')).toBe(false);
    expect(oldish.score).toBe(recent.score - 5);
    expect(ancient.score).toBe(oldish.score - 5);
  });
});

describe('rank — kalite', () => {
  it('yüksek puan + çok oy çöpü ezer; kalite sebebi ancak av≥7 ve vc≥50 iken çıkar', () => {
    const c = ctx();
    const good = scoreCandidate(
      cand({ id: 1, voteAverage: 8, voteCount: 1000 }), answers(), c,
    );
    const junk = scoreCandidate(
      cand({ id: 2, voteAverage: 5.0, voteCount: 12 }), answers(), c,
    );
    expect(good.score).toBeGreaterThan(junk.score);
    expect(good.reasons.some((r) => r.kind === 'quality')).toBe(true);
    expect(junk.reasons.some((r) => r.kind === 'quality')).toBe(false);

    expect(scoreCandidate(cand({ id: 3, voteAverage: 7.5, voteCount: 60 }), answers(), c)
      .reasons.some((r) => r.kind === 'quality')).toBe(true);
    expect(scoreCandidate(cand({ id: 4, voteAverage: 7.5, voteCount: 30 }), answers(), c)
      .reasons.some((r) => r.kind === 'quality')).toBe(false);
    expect(scoreCandidate(cand({ id: 5, voteAverage: 6.9, voteCount: 2000 }), answers(), c)
      .reasons.some((r) => r.kind === 'quality')).toBe(false);
  });

  it("puan negatife düşmez: cezalı sıfır aday 0'a sıkışır", () => {
    const c = ctx({
      affinity: { positive: {}, negative: { 27: 1 }, hasData: true },
    });
    const zero = scoreCandidate(
      cand({ id: 1, genreIds: [27], voteAverage: 0, voteCount: 0, releaseDate: null }),
      answers({ genres: [28] }),
      c,
    );
    expect(zero.score).toBe(0);
  });
});
