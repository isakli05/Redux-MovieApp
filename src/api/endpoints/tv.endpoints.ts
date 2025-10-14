/**
 * TMDB API - TV Show Endpoints
 * Dizi ile ilgili tüm API çağrıları
 */

import { tmdbApi } from '../tmdb.api';
import type { Tvs } from '../../types/tvs';
import type { TvDetails } from '../../types/tvsDetails';
import type { TvCredits } from '../../types/tvCredits';
import type { TvSeasons } from '../../types/tvSeasons';
import type { VideosResponse } from '../../types/videos';
import type { SeasonVideosResponse } from '../../types/seasonVideos';
import type { SeasonAggregateCreditsResponse } from '../../types/seasonCredits';
import { TMDB_CONFIG } from '../../utils/constants';

const API_KEY = TMDB_CONFIG.API_KEY;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

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
      providesTags: (result, error, id) => [{ type: 'TVDetail', id }],
    }),

    // Dizi kadrosu ve ekip - v3 API Key ile
    getTVShowCredits: builder.query<TvCredits, string>({
      query: (tvId) => 
        `/tv/${tvId}/credits?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Credits', id: `tv-${id}` }],
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

    // Discover TV (filtreleme için) - v3 API Key ile
    discoverTVShows: builder.query<Tvs, { watchType?: string; page?: number }>({
      query: ({ watchType, page = 1 }) => {
        const baseUrl = `/discover/tv?language=${LANGUAGE}&page=${page}`;
        return watchType ? `${baseUrl}&${watchType}` : baseUrl;
      },
    }),

    // Free to watch TV shows - v3 API Key ile
    getFreeTVShows: builder.query<Tvs, void>({
      query: () => 
        `/discover/tv?language=${LANGUAGE}&watch_region=US&with_watch_monetization_types=free`,
    }),

    // Dizi videoları (fragmanlar, teaser'lar vb.) - v3 API Key ile
    getTVShowVideos: builder.query<VideosResponse, string>({
      query: (tvId) => 
        `/tv/${tvId}/videos?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'TV', id: `videos-${id}` }],
    }),

    // Sezon videoları - v3 API Key ile
    getSeasonVideos: builder.query<SeasonVideosResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) => 
        `/tv/${tvId}/season/${seasonNumber}/videos?language=${LANGUAGE}`,
      providesTags: (result, error, { tvId, seasonNumber }) => [
        { type: 'SeasonVideos', id: `${tvId}-${seasonNumber}` }
      ],
    }),

    // Sezon aggregate credits - v3 API Key ile
    getSeasonAggregateCredits: builder.query<SeasonAggregateCreditsResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) => 
        `/tv/${tvId}/season/${seasonNumber}/aggregate_credits?language=${LANGUAGE}`,
      providesTags: (result, error, { tvId, seasonNumber }) => [
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
  useGetTVShowCreditsQuery,
  useGetTVSeasonDetailsQuery,
  useGetTVShowRecommendationsQuery,
  useGetSimilarTVShowsQuery,
  useGetTVShowsByNetworkQuery,
  useGetTVShowsByKeywordQuery,
  useDiscoverTVShowsQuery,
  useGetFreeTVShowsQuery,
  useGetTVShowVideosQuery,
  useGetSeasonVideosQuery,
  useGetSeasonAggregateCreditsQuery,
} = tvApi;

