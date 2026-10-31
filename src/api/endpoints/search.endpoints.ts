/**
 * TMDB API - Search Endpoints
 * Arama ile ilgili tüm API çağrıları
 * Hem Türkçe hem İngilizce arama desteği
 */

import { tmdbApi } from '../tmdb.api';
import type { Movies } from '../../types/Movies';
import type { Tvs } from '../../types/tvs';
import type { MultiSearchResults } from '../../types/search';
import { TMDB_CONFIG } from '../../utils/constants';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

export const searchApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Film araması (Türkçe) - v3 API Key ile
    searchMovies: builder.query<Movies, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/movie?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Film araması (İngilizce) - v3 API Key ile
    searchMoviesEN: builder.query<Movies, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/movie?language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Dizi araması (Türkçe) - v3 API Key ile
    searchTVShows: builder.query<Tvs, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/tv?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Dizi araması (İngilizce) - v3 API Key ile
    searchTVShowsEN: builder.query<Tvs, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/tv?language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Çoklu arama (Film + Dizi + Kişi) - Türkçe - v3 API Key ile
    searchMulti: builder.query<MultiSearchResults, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/multi?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Çoklu arama (Film + Dizi + Kişi) - İngilizce - v3 API Key ile
    searchMultiEN: builder.query<MultiSearchResults, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/multi?language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Collection araması - v3 API Key ile
    searchCollections: builder.query<any, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/collection?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}`,
    }),

    // Keyword araması - v3 API Key ile
    searchKeywords: builder.query<any, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/keyword?query=${encodeURIComponent(query)}&page=${page}`,
    }),

    // Trending items (for search suggestions) - v3 API Key ile
    getTrendingForSearch: builder.query<MultiSearchResults, void>({
      query: () =>
        `/trending/all/day?language=${LANGUAGE}`,
      keepUnusedDataFor: 3600, // Cache for 1 hour
    }),

    // v3 Gelişmiş Arama - Çoklu medya türü - API Key ile
    searchMultiAdvanced: builder.query<MultiSearchResults, { 
      query: string; 
      page?: number; 
      include_adult?: boolean;
      region?: string;
    }>({
      query: ({ query, page = 1, include_adult = false, region = 'US' }) =>
        `/search/multi?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=${include_adult}&region=${region}`,
    }),

    // v3 Gelişmiş Film Arama - API Key ile
    searchMoviesAdvanced: builder.query<Movies, { 
      query: string; 
      page?: number; 
      year?: number;
      primary_release_year?: number;
      include_adult?: boolean;
    }>({
      query: ({ query, page = 1, year, primary_release_year, include_adult = false }) => {
        let url = `/search/movie?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=${include_adult}`;
        if (year) url += `&year=${year}`;
        if (primary_release_year) url += `&primary_release_year=${primary_release_year}`;
        return url;
      },
    }),
  }),
});

// Export hooks
export const {
  useSearchMoviesQuery,
  useSearchMoviesENQuery,
  useSearchTVShowsQuery,
  useSearchTVShowsENQuery,
  useSearchMultiQuery,
  useSearchMultiENQuery,
  useSearchCollectionsQuery,
  useSearchKeywordsQuery,
  useGetTrendingForSearchQuery,
  useSearchMultiAdvancedQuery,
  useSearchMoviesAdvancedQuery,
  useLazySearchMoviesQuery,
  useLazySearchMoviesENQuery,
  useLazySearchTVShowsQuery,
  useLazySearchTVShowsENQuery,
  useLazySearchMultiQuery,
  useLazySearchMultiENQuery,
} = searchApi;

