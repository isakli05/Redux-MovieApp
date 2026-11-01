/**
 * Cinema DNA profili — etkileşim günlüğünden türetilen, açıklayan ve
 * geri alınabilir tat profili (SHARED_CONTRACTS §B/§H).
 *
 * İlkeler:
 * - Saf fonksiyon: `deriveDnaProfile(events, meta)`. Ağ/storage yok — test edilir.
 * - Dürüst boyutlar: her skor kanıtını ("12 karşılaştırma, 9 beğeni") ve kanıt
 *   miktarına bağlı bir güven düzeyi taşır. 2 puan asla "yüksek güven" olmaz.
 * - Kişilik etiketi / psikolojik iddia YOK; yalnızca ölçülmüş eğilimler.
 * - Çelişkili girdi (aynı türe hem beğeni hem olumsuz) skoru 0,5'e (nötr) çeker.
 */
import { listInteractions } from '../interactions';
import type { Interaction } from '../interactions';
import { mediaKey } from '../mediaRef';
import { loadMetaCache, type MetaMap } from './meta';
import { genreLabel } from './genres';

export type Confidence = 'yok' | 'az' | 'orta' | 'yüksek';

/** Kanıt (olay) sayısına göre güven — her boyut için ayrı hesaplanır. */
export function confidenceOf(evidenceCount: number): Confidence {
  if (evidenceCount <= 0) return 'yok';
  if (evidenceCount < 4) return 'az';
  if (evidenceCount < 12) return 'orta';
  return 'yüksek';
}

export interface DimensionEntry {
  key: string;
  label: string;
  /** 0–1; 0.5 nötr, 1 güçlü meyil, 0 kaçınma. */
  affinity: number;
  evidenceCount: number;
  evidenceText: string;
  confidence: Confidence;
}

export interface PersonEntry {
  id: number;
  name: string;
  role: 'cast' | 'director';
  score: number;
  evidenceCount: number;
  evidenceText: string;
}

export interface RuntimeProfile {
  mean: number | null;
  count: number;
  tendency: 'kısa' | 'orta' | 'uzun' | null;
  confidence: Confidence;
}

export interface RatingBehavior {
  mean: number | null;
  count: number;
  /** Verilen puan − TMDB ortalaması ortalaması; + cömert, − sert. */
  vsTmdb: number | null;
  confidence: Confidence;
}

export interface DnaProfile {
  /** Tercih taşıyan (nötr olmayan) olay sayısı — profil güveninin temeli. */
  signalCount: number;
  counts: { likes: number; dislikes: number; ratings: number; comparisons: number; seen: number };
  overallConfidence: Confidence;
  overallEvidenceText: string;
  genreDims: DimensionEntry[];
  eraDims: DimensionEntry[];
  runtime: RuntimeProfile;
  ratingBehavior: RatingBehavior;
  people: PersonEntry[];
}

// --- olay → başlık sinyali ---------------------------------------------------

interface TitleSignal {
  score: number;
  likes: number;
  dislikes: number;
  ratings: number;
  comparisons: number;
}

const EMPTY_SIGNAL: TitleSignal = { score: 0, likes: 0, dislikes: 0, ratings: 0, comparisons: 0 };

/** Bir olayın hedef üzerindeki tercih ağırlığı; rating 5–6 nötrdür. */
function eventWeight(event: Interaction): number {
  switch (event.kind) {
    case 'like':
      return 1;
    case 'dislike':
      return -1;
    case 'rating': {
      const r = event.value ?? 0;
      if (r >= 7) return (r - 6) / 4; // 7 → +0.25 … 10 → +1
      if (r <= 4) return -(5 - r) / 4; // 4 → −0.25 … 1 → −1
      return 0;
    }
    default:
      return 0;
  }
}

function bumpSignal(map: Map<string, TitleSignal>, ref: { kind: string; id: number }, weight: number, kind: keyof Omit<TitleSignal, 'score'>): void {
  if (ref.kind === 'person') return;
  const key = mediaKey(ref as { kind: 'movie' | 'tv'; id: number });
  const s = map.get(key) ?? { ...EMPTY_SIGNAL };
  s.score += weight;
  s[kind] += 1;
  map.set(key, s);
}

/** Başlık anahtarı → sinyal. comparison_win/lose hem kazananı hem kaybedeni etkiler. */
export function titleSignals(events: Interaction[]): Map<string, TitleSignal> {
  const map = new Map<string, TitleSignal>();
  for (const e of events) {
    if (e.target.kind === 'person') continue;
    if (e.kind === 'comparison_win' || e.kind === 'comparison_lose') {
      const winner = e.kind === 'comparison_win' ? e.target : e.vs;
      const loser = e.kind === 'comparison_win' ? e.vs : e.target;
      if (winner) bumpSignal(map, winner, 1, 'comparisons');
      if (loser) bumpSignal(map, loser, -0.4, 'comparisons');
    } else if (e.kind === 'like' || e.kind === 'dislike' || e.kind === 'rating') {
      // seen / episode_watched / follow_show tercihle yük taşımaz — sayılmaz.
      bumpSignal(map, e.target, eventWeight(e), e.kind === 'like' ? 'likes' : e.kind === 'dislike' ? 'dislikes' : 'ratings');
    }
  }
  return map;
}

// --- kanıt metinleri ----------------------------------------------------------

function evidenceTextFrom(counts: { likes: number; dislikes: number; ratings: number; comparisons: number }): string {
  const parts: string[] = [];
  if (counts.comparisons) parts.push(`${counts.comparisons} karşılaştırma`);
  if (counts.likes) parts.push(`${counts.likes} beğeni`);
  if (counts.dislikes) parts.push(`${counts.dislikes} olumsuz`);
  if (counts.ratings) parts.push(`${counts.ratings} puan`);
  return parts.length ? parts.join(', ') : 'kanıt yok';
}

function decadeLabel(decade: number): string {
  return `${decade}'ler`;
}

// --- türetme -------------------------------------------------------------------

function emptyProfile(): DnaProfile {
  return {
    signalCount: 0,
    counts: { likes: 0, dislikes: 0, ratings: 0, comparisons: 0, seen: 0 },
    overallConfidence: 'yok',
    overallEvidenceText: 'henüz kanıt yok',
    genreDims: [],
    eraDims: [],
    runtime: { mean: null, count: 0, tendency: null, confidence: 'yok' },
    ratingBehavior: { mean: null, count: 0, vsTmdb: null, confidence: 'yok' },
    people: [],
  };
}

interface DimAcc {
  pos: number;
  neg: number;
  likes: number;
  dislikes: number;
  ratings: number;
  comparisons: number;
}

function toDim(key: string, label: string, acc: DimAcc): DimensionEntry {
  const total = acc.pos + acc.neg;
  const evidenceCount = acc.likes + acc.dislikes + acc.ratings + acc.comparisons;
  return {
    key,
    label,
    affinity: total > 0 ? acc.pos / total : 0.5,
    evidenceCount,
    evidenceText: evidenceTextFrom(acc),
    confidence: confidenceOf(evidenceCount),
  };
}

export function deriveDnaProfile(events: Interaction[], meta: MetaMap): DnaProfile {
  const counts = {
    likes: events.filter((e) => e.kind === 'like').length,
    dislikes: events.filter((e) => e.kind === 'dislike').length,
    ratings: events.filter((e) => e.kind === 'rating').length,
    comparisons: events.filter((e) => e.kind === 'comparison_win' || e.kind === 'comparison_lose').length,
    seen: events.filter((e) => e.kind === 'seen').length,
  };
  const signalCount = counts.likes + counts.dislikes + counts.ratings + counts.comparisons;
  if (!events.length) return emptyProfile();

  const signals = titleSignals(events);

  const genreAcc = new Map<string, DimAcc>();
  const eraAcc = new Map<number, DimAcc>();
  const personAcc = new Map<number, DimAcc & { name: string; role: 'cast' | 'director' }>();
  let runtimeSum = 0;
  let runtimeWeight = 0;
  let runtimeCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  let vsTmdbSum = 0;
  let vsTmdbCount = 0;

  for (const [key, signal] of signals) {
    const m = meta[key];
    const hasPreference = signal.likes + signal.dislikes + signal.ratings + signal.comparisons > 0;
    if (!m || !hasPreference) continue;
    const countsFor = {
      likes: signal.likes,
      dislikes: signal.dislikes,
      ratings: signal.ratings,
      comparisons: signal.comparisons,
    };
    const positive = signal.score > 0;

    for (const g of m.genres) {
      const gk = `${m.kind}:${g}`;
      const acc = genreAcc.get(gk) ?? { pos: 0, neg: 0, ...zeroCounts() };
      addSignal(acc, signal.score, countsFor);
      genreAcc.set(gk, acc);
    }
    if (m.year) {
      const decade = Math.floor(m.year / 10) * 10;
      const acc = eraAcc.get(decade) ?? { pos: 0, neg: 0, ...zeroCounts() };
      addSignal(acc, signal.score, countsFor);
      eraAcc.set(decade, acc);
    }
    if (positive && m.runtime) {
      const w = signal.score + 0.2;
      runtimeSum += m.runtime * w;
      runtimeWeight += w;
      runtimeCount += 1;
    }
    if (positive && m.people) {
      for (const p of m.people) {
        const acc = personAcc.get(p.id) ?? { pos: 0, neg: 0, ...zeroCounts(), name: p.name, role: p.role };
        addSignal(acc, signal.score, countsFor);
        personAcc.set(p.id, acc);
      }
    }
  }

  // Puan davranışı doğrudan rating olaylarından (üst-veri gerektirmez).
  for (const e of events) {
    if (e.kind !== 'rating' || typeof e.value !== 'number') continue;
    ratingSum += e.value;
    ratingCount += 1;
    const m = meta[mediaKey(e.target)];
    if (m && typeof m.voteAverage === 'number') {
      vsTmdbSum += e.value - m.voteAverage;
      vsTmdbCount += 1;
    }
  }

  const byEvidence = (a: DimensionEntry, b: DimensionEntry) => b.evidenceCount - a.evidenceCount || Math.abs(b.affinity - 0.5) - Math.abs(a.affinity - 0.5);

  const genreDims = [...genreAcc.entries()]
    .map(([k, acc]) => toDim(k, genreLabel(k), acc))
    .sort(byEvidence);
  const eraDims = [...eraAcc.entries()]
    .map(([decade, acc]) => toDim(String(decade), decadeLabel(decade), acc))
    .sort(byEvidence)
    .reverse(); // kronolojik görünüm

  const runtimeMean = runtimeWeight > 0 ? Math.round(runtimeSum / runtimeWeight) : null;
  const ratingMean = ratingCount > 0 ? ratingSum / ratingCount : null;
  const vsTmdb = vsTmdbCount > 0 ? vsTmdbSum / vsTmdbCount : null;

  return {
    signalCount,
    counts,
    overallConfidence: confidenceOf(signalCount),
    overallEvidenceText: evidenceTextFrom(counts) + (counts.seen ? `, ${counts.seen} izleme` : ''),
    genreDims,
    eraDims,
    runtime: {
      mean: runtimeMean,
      count: runtimeCount,
      tendency: runtimeMean === null ? null : runtimeMean < 95 ? 'kısa' : runtimeMean <= 140 ? 'orta' : 'uzun',
      confidence: confidenceOf(runtimeCount),
    },
    ratingBehavior: {
      mean: ratingMean === null ? null : Math.round(ratingMean * 10) / 10,
      count: ratingCount,
      vsTmdb: vsTmdb === null ? null : Math.round(vsTmdb * 10) / 10,
      confidence: confidenceOf(ratingCount),
    },
    people: [...personAcc.entries()]
      .map(([id, acc]) => ({
        id,
        name: acc.name,
        role: acc.role,
        score: Math.round(acc.pos * 10) / 10,
        evidenceCount: acc.likes + acc.dislikes + acc.ratings + acc.comparisons,
        evidenceText: evidenceTextFrom(acc),
      }))
      .sort((a, b) => b.score - a.score || b.evidenceCount - a.evidenceCount)
      .slice(0, 8),
  };
}

function zeroCounts() {
  return { likes: 0, dislikes: 0, ratings: 0, comparisons: 0 };
}

function addSignal(acc: DimAcc, score: number, counts: { likes: number; dislikes: number; ratings: number; comparisons: number }): void {
  if (score > 0) acc.pos += score;
  else acc.neg += -score;
  acc.likes += counts.likes;
  acc.dislikes += counts.dislikes;
  acc.ratings += counts.ratings;
  acc.comparisons += counts.comparisons;
}

// --- dışa açılan sözleşmeler ---------------------------------------------------

/**
 * Seans'ın okuyacağı tat ağırlıkları (SHARED_CONTRACTS §H) —
 * `movie:35 → 0.78` biçiminde, 0–1 arası tür meyilleri. Yalnız kanıtlı boyutlar.
 */
export function tasteWeights(profile: DnaProfile): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dim of profile.genreDims) {
    if (dim.evidenceCount > 0) out[dim.key] = Math.round(dim.affinity * 100) / 100;
  }
  return out;
}

/** Eşzamanlı kolay yol: günlük + meta önbelleğinden ağırlıklar (Seans import'u). */
export function getTasteWeights(accountId?: number | null): Record<string, number> {
  const profile = deriveDnaProfile(listInteractions(accountId), loadMetaCache());
  return tasteWeights(profile);
}

/** Group Choice için anonim özet: YALNIZCA tür ağırlıkları — başlık, kişi, kimlik yok. */
export interface GroupTasteSummary {
  version: 1;
  genres: Record<string, number>;
}

export function exportGroupSummary(profile: DnaProfile): GroupTasteSummary {
  const genres: Record<string, number> = {};
  for (const dim of profile.genreDims.slice(0, 12)) {
    if (dim.evidenceCount > 0) genres[dim.key] = Math.round(dim.affinity * 100) / 100;
  }
  return { version: 1, genres };
}
