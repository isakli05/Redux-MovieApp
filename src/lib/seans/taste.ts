/**
 * LMDB Seans — zevk akrabalığı (taste affinity).
 *
 * Kaynak: etkileşim günlüğü (SHARED_CONTRACTS §B — tek doğruluk kaynağı).
 * MedyaRef'te tür bilgisi YOKTUR; bu yüzden pozitif/negatif sinyal veren
 * hedeflerin türleri en fazla TASTE_TARGET_CAP adet için detaydan zenginleştirilir.
 *
 * Sinema DNA profil dosyası (`../dna/profile.ts`) HENÜZ VAR OLMAYABİLİR —
 * import.meta.glob ile savunmacı yüklenir; yoksa sessizce yok sayılır.
 */
import type { Interaction } from '../interactions';
import type { MediaRef } from '../mediaRef';
import { mediaKey } from '../mediaRef';
import { TASTE_TARGET_CAP } from './config';
import type { GenreAffinity } from './types';

/** Günlükteki en yeni N pozitif/negatif hedefi toplar (saf). */
export function collectTasteTargets(events: Interaction[]): {
  positive: MediaRef[];
  negative: MediaRef[];
} {
  const positive: MediaRef[] = [];
  const negative: MediaRef[] = [];
  const seenPositive = new Set<string>();
  const seenNegative = new Set<string>();
  // Yeni sinyaller önde; dizi ve film aynı listede.
  for (const e of [...events].sort((a, b) => b.at - a.at)) {
    const { kind } = e.target;
    if (kind === 'person') continue;
    const key = mediaKey(e.target);
    const isPositive =
      e.kind === 'like' ||
      e.kind === 'follow_show' ||
      e.kind === 'comparison_win' ||
      (e.kind === 'rating' && typeof e.value === 'number' && e.value >= 7);
    const isNegative =
      e.kind === 'dislike' || (e.kind === 'rating' && typeof e.value === 'number' && e.value <= 4);
    if (isPositive && !seenPositive.has(key) && positive.length < TASTE_TARGET_CAP) {
      seenPositive.add(key);
      positive.push(e.target);
    }
    if (isNegative && !seenNegative.has(key) && negative.length < Math.floor(TASTE_TARGET_CAP / 2)) {
      seenNegative.add(key);
      negative.push(e.target);
    }
  }
  return { positive, negative };
}

/** Zenginleştirilmiş hedefler → ağırlık haritası (saf). */
export function deriveGenreAffinity(
  events: Interaction[],
  genreMap: Record<string, number[]>,
): GenreAffinity {
  const affinity: GenreAffinity = { positive: {}, negative: {}, hasData: false };
  const { positive, negative } = collectTasteTargets(events);
  const add = (map: Record<number, number>, genres: number[] | undefined, delta: number) => {
    if (!genres) return;
    for (const g of genres) map[g] = (map[g] ?? 0) + delta;
    affinity.hasData = true;
  };
  for (const ref of positive) add(affinity.positive, genreMap[mediaKey(ref)], 1);
  for (const ref of negative) add(affinity.negative, genreMap[mediaKey(ref)], 1);
  return affinity;
}

/** Bir adayın türlerine göre akrabalık skoru (−3..+3 aralığına sıkışır). */
export function affinityScoreFor(genreIds: number[], affinity: GenreAffinity): number {
  let score = 0;
  for (const g of genreIds) {
    score += affinity.positive[g] ?? 0;
    score -= affinity.negative[g] ?? 0;
  }
  return Math.max(-3, Math.min(3, score));
}

// --- Opsiyonel Sinema DNA profili (savunmacı — dosya henüz yok olabilir) ----

type DnaWeightsModule = {
  default?: unknown;
  getGenreWeights?: () => unknown;
};

/**
 * DNA profil dosyasını import.meta.glob ile bulur (derleme hatası riski yok;
 * dosya yoksa boş kalır). Bilinen iki ihraç şekli tolere edilir:
 * `default: { genreWeights }` veya `getGenreWeights(): Record<number, number>`.
 */
export async function loadDnaWeights(): Promise<Record<number, number>> {
  const modules = import.meta.glob('../dna/profile.ts') as Record<
    string,
    () => Promise<DnaWeightsModule>
  >;
  const paths = Object.keys(modules);
  if (paths.length === 0) return {};
  try {
    const mod = await modules[paths[0]]();
    const fromFactory = typeof mod.getGenreWeights === 'function' ? mod.getGenreWeights() : undefined;
    const raw =
      (typeof fromFactory === 'object' && fromFactory !== null ? fromFactory : undefined) ??
      (mod.default as { genreWeights?: unknown } | undefined)?.genreWeights;
    if (!raw || typeof raw !== 'object') return {};
    const weights: Record<number, number> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const id = Number(k);
      if (Number.isInteger(id) && id > 0 && typeof v === 'number') weights[id] = v;
    }
    return weights;
  } catch {
    return {};
  }
}
