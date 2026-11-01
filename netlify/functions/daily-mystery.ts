/**
 * Günlük Bilmece — daily clue ladder.
 *
 * Route        : GET /api/daily-mystery
 * TMDB calls   : GET /3/{movie|tv}/{id}?language=tr-TR&append_to_response=…
 * Cookie effects: none
 * Validation    : none (public, read-only).
 *
 * The puzzle day is decided SERVER-side from the UTC date (deterministic
 * selection in `src/lib/mystery/core.ts`). The response contains ONLY the clue
 * ladder — the answer never ships here (SHARED_CONTRACTS §E).
 */

import {
  buildClueLadder,
  type MysterySource,
} from '../../src/lib/mystery/clues';
import { candidateOrder, mysteryDateKey } from '../../src/lib/mystery/core';
import { MAX_ATTEMPTS } from '../../src/lib/mystery/scoring';
import { apiError, json, tmdb, type FunctionHandler } from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions). */
export const config = { path: '/api/daily-mystery' };

const APPEND = 'alternative_titles,credits,keywords';
/** Deterministic fallbacks when a pool id no longer resolves on TMDB. */
const MAX_CANDIDATES = 5;

interface CachedSource {
  date: string;
  src: MysterySource;
}

/**
 * Per-instance source cache (one TMDB fetch per warm instance per day).
 * The fetch+map logic is duplicated in daily-mystery-guess.ts — functions are
 * separately bundled and cannot share non-_shared modules.
 */
let cache: CachedSource | null = null;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function yearOf(dateStr: unknown): number | null {
  const m = /^\d{4}/.exec(str(dateStr));
  return m ? Number(m[0]) : null;
}

/** Map a TMDB movie/tv detail record (with appends) to the ladder source. */
export function toMysterySource(mediaType: 'movie' | 'tv', data: Record<string, unknown>): MysterySource {
  const genres = Array.isArray(data.genres)
    ? data.genres.map((g) => str((g as Record<string, unknown>).name)).filter(Boolean)
    : [];
  const cast = Array.isArray((data.credits as Record<string, unknown> | undefined)?.cast)
    ? ((data.credits as { cast: unknown[] }).cast
        .map((c) => str((c as Record<string, unknown>).name))
        .filter(Boolean) as string[])
    : [];
  const crew = Array.isArray((data.credits as Record<string, unknown> | undefined)?.crew)
    ? ((data.credits as { crew: Record<string, unknown>[] }).crew)
    : [];
  const altBlock = data.alternative_titles as Record<string, unknown> | undefined;
  const aliasList = Array.isArray(altBlock?.titles)
    ? (altBlock.titles as Record<string, unknown>[])
    : Array.isArray(altBlock?.results)
      ? (altBlock.results as Record<string, unknown>[])
      : [];
  const keywordBlock = data.keywords as Record<string, unknown> | undefined;
  const keywordList = Array.isArray(keywordBlock?.keywords)
    ? (keywordBlock.keywords as Record<string, unknown>[])
    : Array.isArray(keywordBlock?.results)
      ? (keywordBlock.results as Record<string, unknown>[])
      : [];

  const creators = Array.isArray(data.created_by)
    ? (data.created_by as Record<string, unknown>[]).map((c) => str(c.name)).filter(Boolean)
    : [];

  return {
    mediaType,
    id: typeof data.id === 'number' ? data.id : 0,
    title: str(data.title) || str(data.name),
    originalTitle: str(data.original_title) || str(data.original_name) || undefined,
    releaseYear: yearOf(data.release_date) ?? yearOf(data.first_air_date),
    genres,
    runtimeMinutes: typeof data.runtime === 'number' ? data.runtime : undefined,
    numberOfSeasons: typeof data.number_of_seasons === 'number' ? data.number_of_seasons : undefined,
    directors:
      mediaType === 'tv'
        ? creators
        : crew.filter((c) => c.job === 'Director').map((c) => str(c.name)).filter(Boolean),
    cast,
    keywords: keywordList.map((k) => str(k.name)).filter(Boolean),
    aliases: aliasList.map((a) => str(a.title)).filter(Boolean),
    posterPath: str(data.poster_path) || null,
    overview: str(data.overview),
  };
}

/** Fetch today's source, walking deterministic fallback candidates on failure. */
export async function fetchDailySource(
  dateKey = mysteryDateKey(new Date()),
): Promise<MysterySource | null> {
  if (cache && cache.date === dateKey) return cache.src;
  for (const candidate of candidateOrder(dateKey).slice(0, MAX_CANDIDATES)) {
    const result = await tmdb(`/${candidate.kind}/${candidate.id}`, {
      query: { language: 'tr-TR', append_to_response: APPEND },
    });
    if (result.ok) {
      const src = toMysterySource(candidate.kind, result.data);
      if (src.title && src.id) {
        cache = { date: dateKey, src };
        return src;
      }
    }
  }
  return null;
}

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return apiError(405, 'method_not_allowed');
  }
  const date = mysteryDateKey(new Date());
  const src = await fetchDailySource(date);
  if (!src) {
    return apiError(502, 'upstream_unavailable', 'Bilmece şu anda hazırlanamıyor.');
  }
  const clues = buildClueLadder(src);
  if (clues.length === 0) {
    return apiError(502, 'upstream_unavailable', 'Bilmece şu anda hazırlanamıyor.');
  }
  return json(200, {
    date,
    mediaType: src.mediaType,
    attemptsAllowed: MAX_ATTEMPTS,
    clues,
  });
}) satisfies FunctionHandler;
