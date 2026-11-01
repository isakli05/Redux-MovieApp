/**
 * Clue ladder construction for the daily mystery.
 *
 * The ladder is built SERVER-side from factual TMDB metadata and must never
 * contain the answer (title/original title/aliases). `buildClueLadder` runs a
 * leak scrub over every clue: any text whose normalized form contains a
 * normalized answer, or that shares a distinctive word with one, is dropped.
 */

import type { MysteryKind } from './core';
import type { MysteryAnswer, MysteryClue } from './types';
import { normalizeTitle } from './normalize';

/** The factual fields the ladder is built from (mapped from TMDB in the BFF). */
export interface MysterySource {
  mediaType: MysteryKind;
  id: number;
  /** Localized (tr-TR) display title — the primary accepted answer. */
  title: string;
  originalTitle?: string;
  releaseYear: number | null;
  genres: string[];
  runtimeMinutes?: number;
  numberOfSeasons?: number;
  /** Movie directors, or series creators. */
  directors: string[];
  /** Top-billed cast names. */
  cast: string[];
  /** TMDB keyword names (English). */
  keywords: string[];
  /** TMDB alternative titles (accepted answers). */
  aliases: string[];
  /** Reveal-card-only fields — never used by the ladder itself. */
  posterPath?: string | null;
  overview?: string;
}

/** Normalized answer set used by the leak scrub. */
export function answerSet(src: MysterySource): string[] {
  return [src.title, src.originalTitle ?? '', ...src.aliases].filter((s) => s.trim().length >= 2);
}

/** Reveal payload for a completed challenge (the answer may only travel here). */
export function toAnswerPayload(src: MysterySource): MysteryAnswer {
  const role = src.mediaType === 'tv' ? 'Yaratıcı' : 'Yönetmen';
  const names = src.directors.slice(0, 2).join(', ');
  return {
    mediaType: src.mediaType,
    id: src.id,
    title: src.title,
    year: src.releaseYear,
    posterPath: src.posterPath ?? null,
    creditsLine: names ? `${role}: ${names}` : '',
    overview: src.overview ?? '',
  };
}

/**
 * True when `text` could give the answer away: it embeds a normalized answer
 * ("star wars" inside "star wars universe") or shares a whole word with one
 * (keyword "alien" for the title "Alien").
 */
export function leaksAnswer(text: string, answers: readonly string[]): boolean {
  const textNorm = normalizeTitle(text);
  if (!textNorm) return false;
  for (const answer of answers) {
    const answerNorm = normalizeTitle(answer);
    if (answerNorm.length < 2) continue;
    if (textNorm.includes(answerNorm)) return true;
    const answerWords = new Set(answerNorm.split(' '));
    for (const word of textNorm.split(' ')) {
      if (word.length >= 3 && answerWords.has(word)) return true;
    }
  }
  return false;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0].toLocaleUpperCase('tr-TR')}.`)
      .join(' ') || '?'
  );
}

const DECADES: Record<string, string> = {
  '199': "1990'lar",
  '200': "2000'ler",
  '201': "2010'lar",
  '202': "2020'ler",
  '198': "1980'ler",
  '197': "1970'ler",
};

function decade(year: number): string {
  return DECADES[String(Math.floor(year / 10) * 10).slice(0, 3)] ?? `${Math.floor(year / 10) * 10}'ler`;
}

/** Build the progressively-easier ladder, dropping anything that leaks. */
export function buildClueLadder(src: MysterySource): MysteryClue[] {
  const answers = answerSet(src);
  const safe = (text: string) => !leaksAnswer(text, answers);

  const clues: MysteryClue[] = [];

  // 1 — hardest: type, decade, genres.
  const kindLabel = src.mediaType === 'tv' ? 'Dizi' : 'Film';
  const era = src.releaseYear ? decade(src.releaseYear) : 'Bilinmeyen dönem';
  const genreText = `${kindLabel} • ${era} • ${src.genres.slice(0, 3).join(', ')}`;
  if (src.genres.length > 0) clues.push({ id: 'era-genre', label: 'Tür ve Dönem', text: genreText });

  // 2 — director/creator + lead initials.
  const dirLabel = src.mediaType === 'tv' ? 'Yaratıcı' : 'Yönetmen';
  const dirPart = src.directors.slice(0, 2).map(initials).join(', ');
  const castPart = src.cast.slice(0, 3).map(initials).join(', ');
  const initialText = dirPart
    ? `${dirLabel}: ${dirPart}${castPart ? ` • Başrol: ${castPart}` : ''}`
    : castPart
      ? `Başrol: ${castPart}`
      : '';
  if (initialText) clues.push({ id: 'initials', label: 'Baş Harfler', text: initialText });

  // 3 — plot keywords (scrubbed; TMDB keywords are English).
  const keywords = src.keywords.filter(safe).slice(0, 8);
  if (keywords.length >= 3) {
    clues.push({ id: 'keywords', label: 'Konu Kavramları', text: keywords.join(' • ') });
  }

  // 4 — cast list excerpt.
  const cast = src.cast.filter(safe).slice(0, 4);
  if (cast.length > 0) clues.push({ id: 'cast', label: 'Başroller', text: cast.join(', ') });

  // 5 — easiest: exact year + format facts.
  const formatBits: string[] = [];
  if (src.releaseYear) formatBits.push(`Yayın yılı: ${src.releaseYear}`);
  if (src.mediaType === 'tv') {
    if (src.numberOfSeasons) formatBits.push(`${src.numberOfSeasons} sezon`);
  } else if (src.runtimeMinutes) {
    formatBits.push(`${src.runtimeMinutes} dakika`);
  }
  if (formatBits.length > 0) clues.push({ id: 'year-format', label: 'Yıl ve Biçim', text: formatBits.join(' • ') });

  // Defense in depth: never ship a clue whose text somehow still leaks.
  return clues.filter((c) => safe(c.text));
}
