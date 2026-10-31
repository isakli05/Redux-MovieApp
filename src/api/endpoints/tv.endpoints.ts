/**
 * TMDB API v3 - TV Show Endpoints
 * Dizi ile ilgili tüm API çağrıları (v3 only — D1)
 */

import { tmdbApi } from '../tmdb.api';
import type { Tvs } from '../../types/tvs';
import type { TvDetails } from '../../types/tvsDetails';
import type { TvCredits } from '../../types/tvCredits';
import type { TvSeasons } from '../../types/tvSeasons';
import type { VideosResponse } from '../../types/videos';
import type { SeasonVideosResponse } from '../../types/seasonVideos';
import type { SeasonAggregateCreditsResponse } from '../../types/seasonCredits';
import type { TvDetailFull } from '../../types/detailFull';
import { freeWatchUrl } from '../../types/discover';
import type { FreeWatchArgs } from '../../types/discover';
import { TMDB_CONFIG } from '../../utils/constants';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

// 10 appends (max 20) — see src/types/detailFull.ts header for the list.
// TV uses content_ratings (there is no tv release_dates endpoint).
const TV_APPENDS = [
  'credits',
  'videos',
  'images',
  'recommendations',
  'similar',
  'content_ratings',
  'watch/providers',
  'external_ids',
  'keywords',
  'translations',
].join(',');

export const tvApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Popüler diziler - v3 API Key ile
    getPopularTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) =>
        `/tv/popular?language=${LANGUAGE}&page=${page}`,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'TV' as const, id })),
              { type: 'TV', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'TV', id: 'PARTIAL-LIST' }],
    }),

    // Bugün yayınlanan diziler - v3 API Key ile
    getAiringTodayTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) =>
        `/tv/airing_today?language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'TV', id: 'AIRING-TODAY' }],
    }),

    // Yayında olan diziler - v3 API Key ile
    getOnTheAirTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) =>
        `/tv/on_the_air?language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'TV', id: 'ON-AIR' }],
    }),

    // Dizi detayı - v3 API Key ile
    getTVShowDetails: builder.query<TvDetails, string>({
      query: (tvId) =>
        `/tv/${tvId}?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'TVDetail', id }],
    }),

    /**
     * Full TV detail in one request via append_to_response (10 appends):
     * credits, videos, images (tr,en,null), recommendations, similar,
     * content_ratings, watch/providers, external_ids, keywords, translations.
     */
    getTvDetailFull: builder.query<TvDetailFull, string>({
      query: (tvId) =>
        `/tv/${tvId}?language=${LANGUAGE}` +
        `&append_to_response=${TV_APPENDS}` +
        '&include_image_language=tr,en,null',
      providesTags: (result, _error, id) => [
        { type: 'TVDetail', id },
        ...(result
          ? [
              { type: 'Credits' as const, id: `tv-${id}` },
              { type: 'Media' as const, id: `tv-${id}` },
            ]
          : []),
      ],
    }),

    // Dizi kadrosu ve ekip - v3 API Key ile
    getTVShowCredits: builder.query<TvCredits, string>({
      query: (tvId) =>
        `/tv/${tvId}/credits?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'Credits', id: `tv-${id}` }],
    }),

    // Sezon detayı - v3 API Key ile
    getTVSeasonDetails: builder.query<TvSeasons, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}?language=${LANGUAGE}`,
    }),

    // Dizi önerileri - v3 API Key ile
    getTVShowRecommendations: builder.query<Tvs, string>({
      query: (tvId) =>
        `/tv/${tvId}/recommendations?language=${LANGUAGE}`,
    }),

    // Benzer diziler - v3 API Key ile
    getSimilarTVShows: builder.query<Tvs, string>({
      query: (tvId) =>
        `/tv/${tvId}/similar?language=${LANGUAGE}`,
    }),

    // Network'e göre diziler - v3 API Key ile
    getTVShowsByNetwork: builder.query<Tvs, { networkId: string; page?: number }>({
      query: ({ networkId, page = 1 }) =>
        `/discover/tv?language=${LANGUAGE}&with_networks=${networkId}&page=${page}`,
    }),

    // Keyword'e göre diziler - v3 API Key ile
    getTVShowsByKeyword: builder.query<Tvs, { keywordId: string; page?: number }>({
      query: ({ keywordId, page = 1 }) =>
        `/discover/tv?language=${LANGUAGE}&with_keywords=${keywordId}&page=${page}`,
    }),

    /** @deprecated watch filtreleri region'sız anlamsız (defect I); yeni kod
     *  region-aware discover endpoint'lerini kullanmalı. */
    discoverTVShows: builder.query<Tvs, { watchType?: string; page?: number }>({
      query: ({ watchType, page = 1 }) => {
        const baseUrl = `/discover/tv?language=${LANGUAGE}&page=${page}`;
        return watchType ? `${baseUrl}&${watchType}` : baseUrl;
      },
    }),

    /**
     * Gerçekten ücretsiz diziler (fixes H): discover + with_watch_monetization_types=free.
     * `region` ZORUNLUDUR (TMDB'nin varsayılan watch_region'u yoktur — fix I);
     * çağrı yerinde useRegion().region ile geçirilmelidir.
     */
    getFreeToWatchShows: builder.query<Tvs, FreeWatchArgs>({
      query: (args) => freeWatchUrl('tv', args),
      providesTags: [{ type: 'TV', id: 'FREE-TO-WATCH' }],
    }),

    /**
     * @deprecated watch_region='US' hardcode'ludur (defect I) ve kullanıcının
     * bölgesini yansıtmaz. Yeni kod `getFreeToWatchShows({ region, page })`
     * kullanmalıdır. Home rewrite inene kadar mevcut Free.tsx derlemesi için tutuldu.
     */
    getFreeTVShows: builder.query<Tvs, void>({
      query: () =>
        `/discover/tv?language=${LANGUAGE}&watch_region=US&with_watch_monetization_types=free`,
    }),

    // Dizi videoları (fragmanlar, teaser'lar vb.) - v3 API Key ile
    getTVShowVideos: builder.query<VideosResponse, string>({
      query: (tvId) =>
        `/tv/${tvId}/videos?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'TV', id: `videos-${id}` }],
    }),

    // Sezon videoları - v3 API Key ile
    getSeasonVideos: builder.query<SeasonVideosResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}/videos?language=${LANGUAGE}`,
      providesTags: (result, _error, { tvId, seasonNumber }) => [
        { type: 'SeasonVideos', id: `${tvId}-${seasonNumber}` }
      ],
    }),

    // Sezon aggregate credits - v3 API Key ile
    getSeasonAggregateCredits: builder.query<SeasonAggregateCreditsResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}/aggregate_credits?language=${LANGUAGE}`,
      providesTags: (result, _error, { tvId, seasonNumber }) => [
        { type: 'SeasonCredits', id: `${tvId}-${seasonNumber}` }
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetPopularTVShowsQuery,
  useGetAiringTodayTVShowsQuery,
  useGetOnTheAirTVShowsQuery,
  useGetTVShowDetailsQuery,
  useGetTvDetailFullQuery,
  useGetTVShowCreditsQuery,
  useGetTVSeasonDetailsQuery,
  useGetTVShowRecommendationsQuery,
  useGetSimilarTVShowsQuery,
  useGetTVShowsByNetworkQuery,
  useGetTVShowsByKeywordQuery,
  useDiscoverTVShowsQuery,
  useGetFreeToWatchShowsQuery,
  useGetFreeTVShowsQuery,
  useGetTVShowVideosQuery,
  useGetSeasonVideosQuery,
  useGetSeasonAggregateCreditsQuery,
} = tvApi;
