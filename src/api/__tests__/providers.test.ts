import { describe, expect, it } from 'vitest';
import {
  normalizeWatchProviders,
  watchProvidersUrl,
  watchRegionsUrl,
} from '../endpoints/providers.endpoints';
import { TMDB_CONFIG } from '../../utils/constants';

const provider = (id: number, name: string) => ({
  provider_id: id,
  provider_name: name,
  display_priority: id,
  logo_path: `/l${id}.jpg`,
});

describe('getWatchProviders (fix I)', () => {
  it('builds the provider URL per media type and id (watchProvidersUrl is the endpoint query fn)', () => {
    expect(watchProvidersUrl({ mediaType: 'movie', id: 550 })).toBe(
      `/movie/550/watch/providers?language=${TMDB_CONFIG.LANGUAGE}`,
    );
    expect(watchProvidersUrl({ mediaType: 'tv', id: '1399' })).toBe(
      `/tv/1399/watch/providers?language=${TMDB_CONFIG.LANGUAGE}`,
    );
  });

  it('normalizes raw results into region → {link, flatrate, rent, buy, ads, free}', () => {
    const normalized = normalizeWatchProviders({
      id: 550,
      results: {
        TR: {
          link: 'https://justwatch.com/tr/fight-club',
          flatrate: [provider(1, 'Netflix')],
          free: [provider(2, 'TRT')],
        },
        US: {},
      },
    });

    expect(normalized.TR.link).toBe('https://justwatch.com/tr/fight-club');
    expect(normalized.TR.flatrate).toHaveLength(1);
    expect(normalized.TR.flatrate[0].provider_name).toBe('Netflix');
    expect(normalized.TR.free).toHaveLength(1);
    expect(normalized.TR.rent).toEqual([]);
    expect(normalized.TR.buy).toEqual([]);
    expect(normalized.TR.ads).toEqual([]);

    expect(normalized.US.link).toBeNull();
    expect(normalized.US.flatrate).toEqual([]);
    expect(Object.keys(normalized)).toEqual(['TR', 'US']);
  });

  it('never throws on an empty response body', () => {
    expect(normalizeWatchProviders({ id: 1, results: {} })).toEqual({});
    expect(
      normalizeWatchProviders(undefined as unknown as Parameters<typeof normalizeWatchProviders>[0]),
    ).toEqual({});
  });
});

describe('getWatchRegions', () => {
  it('builds the regions URL (watchRegionsUrl is the endpoint query fn)', () => {
    expect(watchRegionsUrl()).toBe(`/watch/providers/regions?language=${TMDB_CONFIG.LANGUAGE}`);
  });
});
