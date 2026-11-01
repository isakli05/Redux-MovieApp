/**
 * Onboarding havuzu ve ikili karşılaştırma motoru testleri.
 */
import { describe, expect, it } from 'vitest';
import { buildPool, comparedPairKeys, nextPair, type PoolItem } from '../../lib/dna/onboarding';
import type { Interaction } from '../../lib/interactions';

function popular(id: number, opts: { title?: string; poster?: string | null; genre?: number; pop?: number; votes?: number } = {}) {
  return {
    id,
    title: opts.title ?? `Film ${id}`,
    poster_path: opts.poster === undefined ? '/p.jpg' : opts.poster,
    popularity: opts.pop ?? id,
    genre_ids: [opts.genre ?? 18],
    vote_count: opts.votes ?? 500,
  };
}

function tvPopular(id: number, genre = 10759) {
  return { id, name: `Dizi ${id}`, poster_path: '/t.jpg', popularity: id, genre_ids: [genre], vote_count: 500 };
}

describe('buildPool', () => {
  it('postersiz ve az oylu başlıkları eler, film+diziyi karıştırır', () => {
    const pool = buildPool(
      [popular(1), popular(2, { poster: null }), popular(3, { votes: 10 })],
      [tvPopular(101)],
    );
    const ids = pool.map((p) => p.ref.id);
    expect(ids).toContain(1);
    expect(ids).not.toContain(2); // postersiz
    expect(ids).not.toContain(3); // vote_count ≤ 200
    expect(ids).toContain(101); // dizi karışımda
  });

  it('tür çeşitliliği için birincil türlere göre turlar ve sınıra uyar', () => {
    const movies = [18, 18, 18, 878, 878, 35, 27, 9648].map((g, i) => popular(i + 1, { genre: g }));
    const pool = buildPool(movies, [], 6);
    expect(pool).toHaveLength(6);
    const genres = pool.map((p) => p.primaryGenre);
    expect(new Set(genres).size).toBeGreaterThanOrEqual(4); // üst üste aynı tür yığılmaz
  });
});

describe('nextPair', () => {
  const pool: PoolItem[] = [
    { ref: { kind: 'movie', id: 1, title: 'A' }, genres: [18], primaryGenre: 18, popularity: 1 },
    { ref: { kind: 'movie', id: 2, title: 'B' }, genres: [878], primaryGenre: 878, popularity: 2 },
    { ref: { kind: 'movie', id: 3, title: 'C' }, genres: [35], primaryGenre: 35, popularity: 3 },
    { ref: { kind: 'movie', id: 4, title: 'D' }, genres: [27], primaryGenre: 27, popularity: 4 },
  ];

  it('iki farklı başlık döner ve mümkünse farklı birincil tür seçer', () => {
    const pair = nextPair(pool, []);
    expect(pair).not.toBeNull();
    const [a, b] = pair!;
    expect(a.ref.id).not.toBe(b.ref.id);
    expect(a.primaryGenre).not.toBe(b.primaryGenre);
  });

  it('sorulan çifti bir daha sormaz; havuz tükenince null döner', () => {
    const events: Interaction[] = [];
    const seen = new Set<string>();
    let guard = 0;
    // Tüm olası çiftleri sorup günlüğe yaz (3+ başlık → farklı türler tükenince
    // farklı tür kısıtı gevşer; sorulan-çift kısıtı asla gevşemez).
    for (;;) {
      const pair = nextPair(pool, events);
      if (!pair || guard++ > 100) break;
      const [a, b] = pair;
      const key = a.ref.id < b.ref.id ? `${a.ref.id}|${b.ref.id}` : `${b.ref.id}|${a.ref.id}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      events.push({
        id: `e-${key}`,
        kind: 'comparison_win',
        target: { kind: 'movie', id: a.ref.id },
        vs: { kind: 'movie', id: b.ref.id },
        at: events.length,
        source: 'dna',
      });
    }
    // 4 başlıkta en fazla C(4,2)=6 çift var.
    expect(seen.size).toBe(6);
    expect(nextPair(pool, events)).toBeNull();
  });

  it('comparison_win ve comparison_lose olaylarının ikisi de sorulan çift sayılır', () => {
    const events: Interaction[] = [
      {
        id: 'e1',
        kind: 'comparison_lose',
        target: { kind: 'movie', id: 1 },
        vs: { kind: 'movie', id: 2 },
        at: 1,
        source: 'dna',
      },
    ];
    expect(comparedPairKeys(events)).toEqual(new Set(['movie:1|movie:2']));
    const pair = nextPair(pool, events);
    if (pair) {
      const ids = pair.map((p) => p.ref.id).sort((x, y) => x - y);
      expect(ids.join('|')).not.toBe('1|2');
    }
  });

  it('cold-start: tek karşılaştırmadan profil ilk izi taşır', async () => {
    const { deriveDnaProfile } = await import('../../lib/dna/profile');
    const events: Interaction[] = [
      {
        id: 'e1',
        kind: 'comparison_win',
        target: { kind: 'movie', id: 1 },
        vs: { kind: 'movie', id: 2 },
        at: 1,
        source: 'dna',
      },
    ];
    const meta = {
      'movie:1': { key: 'movie:1', kind: 'movie' as const, id: 1, genres: [878], year: 2020 },
      'movie:2': { key: 'movie:2', kind: 'movie' as const, id: 2, genres: [35], year: 2020 },
    };
    const p = deriveDnaProfile(events, meta);
    expect(p.signalCount).toBe(1);
    expect(p.genreDims.find((d) => d.key === 'movie:878')?.affinity).toBeCloseTo(1);
    expect(p.overallConfidence).toBe('az'); // az kanıt → davet devam eder
  });
});
