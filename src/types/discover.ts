/**
 * Shared discover / free-watch contracts (fixes H + I).
 * Watch-region filter'ları TMDB'de region'sız çalışmaz; bu yüzden `region`
 * tüm yeni free/discover endpoint'lerinde ZORUNLU argümandır (useRegion'dan).
 */

import { TMDB_CONFIG } from '../utils/constants';

/** Free-watch discover arg shape — region explicit, page optional. */
export interface FreeWatchArgs {
  /** ISO 3166-1 watch region (e.g. 'TR'). Required — TMDB has no default. */
  region: string;
  page?: number;
}

/**
 * Build the free-to-watch discover URL for movie|tv (fix H):
 * watch_region + with_watch_monetization_types=free watched together,
 * popularity-desc ordering, vote_count.gte=20 for credible ordering.
 */
export const freeWatchUrl = (
  mediaType: 'movie' | 'tv',
  { region, page = 1 }: FreeWatchArgs,
): string => {
  const safeRegion = encodeURIComponent(region.trim().toUpperCase());
  return (
    `/discover/${mediaType}?language=${TMDB_CONFIG.LANGUAGE}` +
    `&watch_region=${safeRegion}` +
    '&with_watch_monetization_types=free' +
    '&sort_by=popularity.desc' +
    '&vote_count.gte=20' +
    `&page=${page}`
  );
};
