/**
 * Tat onboarding'i — hızlı ikili karşılaştırmalar (comparison_win/lose).
 *
 * Popüler başlık havuzundan (BFF üzerinden getPopularMovies/TVShows) tür
 * çeşitliliği gözetilmiş çiftler kurulur; daha önce sorulan çiftler bir daha
 * sorulmaz. Tek karşılaştırmadan bile profil ilk izi taşır (cold-start).
 */
import type { Interaction } from '../interactions';
import { mediaKey, type MediaRef } from '../mediaRef';

export interface PoolItem {
  ref: MediaRef;
  genres: number[];
  primaryGenre: number | null;
  popularity: number;
}

interface RawPopularItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  popularity?: number;
  genre_ids?: number[];
  vote_count?: number;
}

/**
 * Popüler film+dizi sayfalarından karışık, posterli, tür-çeşitli havuz.
 * Aynı tür üst üste yığılmasın diye birincil türe göre sıraya alınır.
 */
export function buildPool(movies: RawPopularItem[], tvs: RawPopularItem[], max = 24): PoolItem[] {
  const toItems = (raw: RawPopularItem[], kind: 'movie' | 'tv'): PoolItem[] =>
    raw
      .filter((r) => r.poster_path && (kind === 'movie' ? r.title : r.name) && (r.vote_count ?? 0) > 200)
      .map((r) => ({
        ref: {
          kind,
          id: r.id,
          title: (kind === 'movie' ? r.title : r.name) as string,
          posterPath: r.poster_path ?? null,
        },
        genres: r.genre_ids ?? [],
        primaryGenre: r.genre_ids?.[0] ?? null,
        popularity: r.popularity ?? 0,
      }));

  // Popülerliğe göre sırala, film+dizi karıştır, sonra birincil tür turu.
  const merged = [...toItems(movies, 'movie'), ...toItems(tvs, 'tv')].sort((a, b) => b.popularity - a.popularity).slice(0, max * 2);
  const byGenre = new Map<number | string, PoolItem[]>();
  for (const item of merged) {
    const g = item.primaryGenre ?? 'none';
    byGenre.set(g, [...(byGenre.get(g) ?? []), item]);
  }
  const queues = [...byGenre.values()];
  const pool: PoolItem[] = [];
  let added = true;
  while (pool.length < max && added) {
    added = false;
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        pool.push(next);
        added = true;
        if (pool.length >= max) break;
      }
    }
  }
  return pool;
}

/** Günlükten daha önce sorulan çift anahtarları (sorted join). */
export function comparedPairKeys(events: Interaction[]): Set<string> {
  const keys = new Set<string>();
  for (const e of events) {
    if (e.kind !== 'comparison_win' && e.kind !== 'comparison_lose') continue;
    if (!e.vs) continue;
    const a = mediaKey(e.target);
    const b = mediaKey(e.vs);
    keys.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return keys;
}

function appearanceCounts(events: Interaction[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== 'comparison_win' && e.kind !== 'comparison_lose') continue;
    for (const ref of [e.target, e.vs]) {
      if (!ref) continue;
      const k = mediaKey(ref);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return counts;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sıradaki çift: en az sorulanlardan biri + farklı birincil türden, hiç
 * sorulmamış bir eş. Havuz < 2 veya tüm çiftler bittiyse null.
 */
export function nextPair(pool: PoolItem[], events: Interaction[]): [PoolItem, PoolItem] | null {
  if (pool.length < 2) return null;
  const asked = comparedPairKeys(events);
  const appearances = appearanceCounts(events);
  const leastShown = (items: PoolItem[]): PoolItem[] => {
    const min = Math.min(...items.map((i) => appearances.get(mediaKey(i.ref)) ?? 0));
    return items.filter((i) => (appearances.get(mediaKey(i.ref)) ?? 0) === min);
  };

  for (let attempt = 0; attempt < 40; attempt++) {
    const a = attempt === 0 ? pick(leastShown(pool)) : pick(pool);
    const candidates = pool.filter(
      (b) => b !== a && b.primaryGenre !== a.primaryGenre && !asked.has(pairKey(a, b)),
    );
    const fallback = pool.filter((b) => b !== a && !asked.has(pairKey(a, b)));
    const list = candidates.length ? candidates : fallback;
    if (list.length) {
      const b = pick(leastShown(list));
      if (b) return [a, b];
    }
  }
  return null;
}

function pairKey(a: PoolItem, b: PoolItem): string {
  const ka = mediaKey(a.ref);
  const kb = mediaKey(b.ref);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}
