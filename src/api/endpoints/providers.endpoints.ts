/**
 * TMDB API v3 - Watch Provider Endpoints (region-aware, fixes I)
 * `/watch/providers/regions` ve `/watch/providers` (append) kaynakları.
 * JustWatch atıfı bu veriyi gösteren her UI'da zorunludur (D7).
 */

import { tmdbApi } from '../tmdb.api';
import type {
  RawWatchProvidersResponse,
  RawRegionProviders,
  WatchProviderEntry,
} from '../../types/detailFull';
import { TMDB_CONFIG } from '../../utils/constants';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

/** Bölge seçenekleri (drop-down): `/watch/providers/regions`. */
export interface RegionOption {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}

/** Normalize edilmiş bölge başına sağlayıcı bloğu. */
export interface RegionProviders {
  link: string | null;
  flatrate: WatchProviderEntry[];
  rent: WatchProviderEntry[];
  buy: WatchProviderEntry[];
  ads: WatchProviderEntry[];
  free: WatchProviderEntry[];
}

/** `{ TR: RegionProviders, US: … }` — country → providers haritası. */
export type WatchProvidersMap = Record<string, RegionProviders>;

const pick = (block: RawRegionProviders | undefined, key: keyof RawRegionProviders): WatchProviderEntry[] => {
  const value = block?.[key];
  return Array.isArray(value) ? value : [];
};

/**
 * Raw watch/providers response → normalized map. Tüm monetization kategorileri
 * her zaman dizi olarak mevcuttur (eksik olan boş diziye düşer), never throws.
 */
export const normalizeWatchProviders = (raw: RawWatchProvidersResponse): WatchProvidersMap => {
  const map: WatchProvidersMap = {};
  const entries = raw?.results && typeof raw.results === 'object' ? Object.entries(raw.results) : [];
  for (const [region, block] of entries) {
    map[region] = {
      link: block?.link ?? null,
      flatrate: pick(block, 'flatrate'),
      rent: pick(block, 'rent'),
      buy: pick(block, 'buy'),
      ads: pick(block, 'ads'),
      free: pick(block, 'free'),
    };
  }
  return map;
};

/** URL builders (exported for URL-construction tests). */
export const watchRegionsUrl = (): string =>
  `/watch/providers/regions?language=${LANGUAGE}`;

export const watchProvidersUrl = ({
  mediaType,
  id,
}: {
  mediaType: 'movie' | 'tv';
  id: string | number;
}): string => `/${mediaType}/${id}/watch/providers?language=${LANGUAGE}`;

export const providersApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Desteklenen watch bölgeleri (useRegion doğrulaması için cache'lenir).
     * TMDB bu endpoint'te bazen düz dizi, bazen { results } döner — ikisi de
     * normalize edilir.
     */
    getWatchRegions: builder.query<RegionOption[], void>({
      query: watchRegionsUrl,
      transformResponse: (raw: unknown): RegionOption[] => {
        const list = Array.isArray(raw)
          ? raw
          : (raw as { results?: RegionOption[] } | null)?.results;
        return Array.isArray(list) ? list : [];
      },
      providesTags: [{ type: 'Region', id: 'LIST' }],
    }),

    /**
     * Bir film/dizi için bölge başına izleme sağlayıcıları (normalize edilmiş).
     * Not: endpoint tek istek tüm bölgeleri döner; UI `{region}` anahtarından okur.
     */
    getWatchProviders: builder.query<
      WatchProvidersMap,
      { mediaType: 'movie' | 'tv'; id: string | number }
    >({
      query: watchProvidersUrl,
      transformResponse: (raw: RawWatchProvidersResponse) => normalizeWatchProviders(raw),
      providesTags: (_result, _error, { mediaType, id }) => [
        { type: 'Provider', id: `${mediaType}-${id}` },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetWatchRegionsQuery,
  useGetWatchProvidersQuery,
} = providersApi;
