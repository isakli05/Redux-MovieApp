/**
 * TMDB API - TV Show Endpoints
 * Dizi ile ilgili tüm API çağrıları
 */

import { tmdbApi } from '../tmdb.api';
import type { Tvs } from '../../types/tvs';
import type { TvDetails } from '../../types/tvsDetails';
import type { TvCredits } from '../../types/tvCredits';
import type { TvSeasons } from '../../types/tvSeasons';
import { TMDB_CONFIG } from '../../utils/constants';

const API_KEY = TMDB_CONFIG.API_KEY;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

export const tvApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Popüler diziler
    getPopularTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) => 
        `/tv/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`,
      providesTags: (result) => 
        result 
          ? [
              ...result.results.map(({ id }) => ({ type: 'TV' as const, id })),
              { type: 'TV', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'TV', id: 'PARTIAL-LIST' }],
    }),

    // Bugün yayınlanan diziler
    getAiringTodayTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) => 
        `/tv/airing_today?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'TV', id: 'AIRING-TODAY' }],
    }),

    // Yayında olan diziler
    getOnTheAirTVShows: builder.query<Tvs, number | void>({
      query: (page = 1) => 
        `/tv/on_the_air?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'TV', id: 'ON-AIR' }],
    }),

    // Dizi detayı
    getTVShowDetails: builder.query<TvDetails, string>({
      query: (tvId) => 
        `/tv/${tvId}?api_key=${API_KEY}&language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'TVDetail', id }],
    }),

    // Dizi kadrosu ve ekip
    getTVShowCredits: builder.query<TvCredits, string>({
      query: (tvId) => 
        `/tv/${tvId}/credits?api_key=${API_KEY}&language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Credits', id: `tv-${id}` }],
    }),

    // Sezon detayı
    getTVSeasonDetails: builder.query<TvSeasons, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) => 
        `/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=${LANGUAGE}`,
    }),

    // Dizi önerileri
    getTVShowRecommendations: builder.query<Tvs, string>({
      query: (tvId) => 
        `/tv/${tvId}/recommendations?api_key=${API_KEY}&language=${LANGUAGE}`,
    }),

    // Benzer diziler
    getSimilarTVShows: builder.query<Tvs, string>({
      query: (tvId) => 
        `/tv/${tvId}/similar?api_key=${API_KEY}&language=${LANGUAGE}`,
    }),

    // Network'e göre diziler
    getTVShowsByNetwork: builder.query<Tvs, { networkId: string; page?: number }>({
      query: ({ networkId, page = 1 }) => 
        `/discover/tv?api_key=${API_KEY}&language=${LANGUAGE}&with_networks=${networkId}&page=${page}`,
    }),

    // Keyword'e göre diziler
    getTVShowsByKeyword: builder.query<Tvs, { keywordId: string; page?: number }>({
      query: ({ keywordId, page = 1 }) => 
        `/discover/tv?api_key=${API_KEY}&language=${LANGUAGE}&with_keywords=${keywordId}&page=${page}`,
    }),

    // Discover TV (filtreleme için)
    discoverTVShows: builder.query<Tvs, { watchType?: string; page?: number }>({
      query: ({ watchType, page = 1 }) => {
        const baseUrl = `/discover/tv?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`;
        return watchType ? `${baseUrl}&${watchType}` : baseUrl;
      },
    }),

    // Free to watch TV shows
    getFreeTVShows: builder.query<Tvs, void>({
      query: () => 
        `/discover/tv?api_key=${API_KEY}&watch_region=US&with_watch_monetization_types=free`,
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
} = tvApi;

