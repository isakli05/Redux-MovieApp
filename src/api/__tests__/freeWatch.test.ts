import { describe, expect, it } from 'vitest';
import { freeWatchUrl } from '../../types/discover';
import { TMDB_CONFIG } from '../../utils/constants';

const expectedUrl = (mediaType: 'movie' | 'tv', region: string, page: number) =>
  `/discover/${mediaType}?language=${TMDB_CONFIG.LANGUAGE}` +
  `&watch_region=${region}` +
  '&with_watch_monetization_types=free' +
  '&sort_by=popularity.desc' +
  '&vote_count.gte=20' +
  `&page=${page}`;

describe('free-to-watch discover URLs (fixes H + I)', () => {
  it('getFreeToWatchMovies query (freeWatchUrl) builds the region-scoped free discover query', () => {
    // getFreeToWatchMovies' query is `freeWatchUrl('movie', args)` — same fn under test.
    expect(freeWatchUrl('movie', { region: 'DE', page: 2 })).toBe(expectedUrl('movie', 'DE', 2));
    expect(freeWatchUrl('movie', { region: 'tr' })).toBe(expectedUrl('movie', 'TR', 1));
  });

  it('getFreeToWatchShows query (freeWatchUrl) builds the region-scoped free discover query', () => {
    expect(freeWatchUrl('tv', { region: 'TR' })).toBe(expectedUrl('tv', 'TR', 1));
  });

  it('always sends watch_region + monetization filter together (never defaults a region)', () => {
    const url = freeWatchUrl('movie', { region: 'US', page: 1 });
    expect(url).toContain('watch_region=US');
    expect(url).toContain('with_watch_monetization_types=free');
    expect(url).toContain('sort_by=popularity.desc');
    expect(url).toContain('vote_count.gte=20');
  });
});
