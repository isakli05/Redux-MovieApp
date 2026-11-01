/**
 * LMDB Seans — deterministik, açıklanabilir aday puanlayıcı.
 *
 * Puan = türUyumu(≤30) + ruhHaliUyumu(≤20) + kalite(≤20) + dönem(≤10)
 *        + zevkAkrabalığı(≤15) + ceza(−8). Sıralama: puan ↓, başlık (tr),
 *        id ↑ — aynı girdi her zaman aynı sonucu verir.
 *
 * SEBEP UYDURMAK YASAK: her MatchReason puanı gerçekten besleyen bir
 * eşleşmeden üretilir; mood bir TMDB alanı değil, vekil tür ağırlığıdır.
 */
import type { Interaction } from '../interactions';
import { mediaKey } from '../mediaRef';
import { moodDef, moodGenreIds } from './config';
import { affinityScoreFor } from './taste';
import type {
  MatchReason,
  RankedCandidate,
  RuntimeWindowId,
  SeansAnswers,
  SeansCandidate,
  SeansContext,
} from './types';

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

function yearOf(candidate: SeansCandidate): number | null {
  const date = candidate.releaseDate;
  if (!date || date.length < 4) return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : null;
}

function genreNamesOf(ids: number[], ctx: SeansContext): string {
  return ids
    .map((id) => ctx.genreNames[id])
    .filter((name): name is string => Boolean(name))
    .slice(0, 3)
    .join(', ');
}

/** Mood vekil türleri: sıra = ağırlık (ilk tür 3, sonra 2, 1...). */
export function moodMatchWeight(genreIds: number[], answers: SeansAnswers): number {
  const weights = moodGenreIds(answers.mood, answers.kind);
  let matched = 0;
  weights.forEach((genreId, index) => {
    if (genreIds.includes(genreId)) matched += Math.max(1, weights.length - index);
  });
  return Math.min(matched, 3);
}

/** Tek adayın puanı + gerçek eşleşme sebepleri. */
export function scoreCandidate(
  candidate: SeansCandidate,
  answers: SeansAnswers,
  ctx: SeansContext,
): RankedCandidate {
  const reasons: MatchReason[] = [];
  let score = 0;

  // 1) Tür uyumu — kullanıcının seçtiği türlerle kesişim.
  const overlap = answers.genres.filter((g) => candidate.genreIds.includes(g));
  if (answers.genres.length === 0) {
    score += 12; // tür seçilmemiş: yatay puan, sebep yok
  } else if (overlap.length > 0) {
    score += 18 + Math.min(overlap.length, 3) * 4;
    const names = genreNamesOf(overlap, ctx);
    reasons.push({
      kind: 'genre',
      label: names
        ? `Seçtiğin türlerden ${overlap.length} tanesi: ${names}`
        : `Seçtiğin türlerden ${overlap.length} tanesi`,
    });
  }

  // 2) Ruh hâli vekilleri — TMDB'de mood alanı yok; tür ağırlıklarıyla eşleşir.
  const moodWeight = moodMatchWeight(candidate.genreIds, answers);
  if (moodWeight > 0) {
    score += Math.round((moodWeight / 3) * 20);
    if (moodWeight >= 2) {
      const def = moodDef(answers.mood);
      const matchedMoodGenres = moodGenreIds(answers.mood, answers.kind).filter((g) =>
        candidate.genreIds.includes(g),
      );
      const names = genreNamesOf(matchedMoodGenres, ctx);
      reasons.push({
        kind: 'mood',
        label: names
          ? `“${def?.label}” ruh hâli türleriyle uyumlu: ${names}`
          : `“${def?.label}” ruh hâliyle uyumlu`,
      });
    }
  }

  // 3) Kalite — izleyici puanı + oy sayısı.
  const { voteAverage: av, voteCount: vc } = candidate;
  score += av >= 8 ? 12 : av >= 7 ? 9 : av >= 6 ? 6 : av >= 5 ? 3 : 0;
  score += vc >= 1000 ? 8 : vc >= 300 ? 5 : vc >= 50 ? 3 : vc >= 10 ? 1 : 0;
  if (av >= 7 && vc >= 50) {
    reasons.push({
      kind: 'quality',
      label: `${av.toFixed(1)} izleyici puanı (${vc.toLocaleString('tr-TR')} oy)`,
    });
  }

  // 4) Dönem — bu akşam kararlarında güncellik hafif bonus.
  const year = yearOf(candidate);
  const nowYear = new Date(ctx.now).getFullYear();
  if (year) {
    if (year >= nowYear - 10) {
      score += 10;
      reasons.push({ kind: 'era', label: 'Son 10 yılın yapımı' });
    } else if (year >= nowYear - 25) {
      score += 5;
    }
  }

  // 5) Zevk akrabalığı — bilinen sular ödüyler, keşif modu bilinmeyeni ödüllendirir.
  if (ctx.affinity.hasData && candidate.genreIds.length > 0) {
    const affinity = affinityScoreFor(candidate.genreIds, ctx.affinity);
    if (answers.familiarity === 'adventurous') {
      score += Math.round(((3 - Math.max(0, affinity)) / 3) * 10);
      if (affinity <= 0) {
        reasons.push({ kind: 'novelty', label: 'Zevk alışkanlıklarının dışında — keşif modu' });
      }
    } else {
      const pts = Math.round((Math.max(0, affinity) / 3) * 15);
      score += pts;
      if (pts >= 8) {
        const likedGenres = candidate.genreIds.filter((g) => (ctx.affinity.positive[g] ?? 0) > 0);
        const names = genreNamesOf(likedGenres, ctx);
        reasons.push({
          kind: 'taste',
          label: names
            ? `Geçmiş izlemelerine yakın: ${names}`
            : 'Geçmiş izlemelerine yakın',
        });
      }
    }
    // Negatif sinyal veren türlerde aday geriler.
    if (candidate.genreIds.some((g) => (ctx.affinity.negative[g] ?? 0) > 0)) {
      score -= 8;
    }
  }

  // 6) Bağlamsal sebepler — sunucu tarafında zaten filtrelenmiş kriterler.
  if (answers.providers.length > 0 && answers.region) {
    reasons.push({ kind: 'provider', label: 'Seçtiğin yayın servislerinde yayında' });
  }
  if (answers.runtime !== 'any') {
    reasons.push({ kind: 'runtime', label: 'İstediğin süre aralığında' });
  }
  if (answers.seed && ctx.seedGenreIds && ctx.seedGenreIds.length > 0) {
    const seedOverlap = ctx.seedGenreIds.filter((g) => candidate.genreIds.includes(g));
    if (seedOverlap.length > 0) {
      const names = genreNamesOf(seedOverlap, ctx);
      reasons.push({
        kind: 'seed',
        label: names
          ? `Başlangıç yapımıyla ortak türler: ${names}`
          : 'Başlangıç yapımıyla ortak türleri var',
      });
    }
  }

  return { candidate, score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

/**
 * Günlükten hariç tutulacak hedefler: izlenenler (seen + episode_watched),
 * reddedilenler (seans_reject) ve dislike'lananlar (SHARED_CONTRACTS §H).
 */
export function excludedKeysFromLog(events: Interaction[]): Set<string> {
  const keys = new Set<string>();
  for (const e of events) {
    if (e.target.kind === 'person') continue;
    if (e.kind === 'seen' || e.kind === 'episode_watched' || e.kind === 'seans_reject' || e.kind === 'dislike') {
      keys.add(mediaKey(e.target));
    }
  }
  return keys;
}

/** Havuzu puanla, hariç tut, deterministik sırala. */
export function rankPool(
  pool: SeansCandidate[],
  answers: SeansAnswers,
  ctx: SeansContext,
  excluded: Set<string>,
): RankedCandidate[] {
  const seedKey = answers.seed ? mediaKey(answers.seed) : null;
  return pool
    .filter((c) => {
      const key = mediaKey(c.ref);
      return key !== seedKey && !excluded.has(key);
    })
    .map((c) => scoreCandidate(c, answers, ctx))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.candidate.title.localeCompare(b.candidate.title, 'tr') ||
        a.candidate.ref.id - b.candidate.ref.id,
    );
}

/** Süre penceresinin kısa etiketi — sonuç özetinde gösterilir. */
export function runtimeLabel(id: RuntimeWindowId): string {
  return { short: 'Kısa', medium: 'Orta', long: 'Uzun', any: 'Süre fark etmez' }[id];
}
