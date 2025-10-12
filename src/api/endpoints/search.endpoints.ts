/**
 * TMDB API - Search Endpoints
 * Arama ile ilgili tüm API çağrıları
 * Hem Türkçe hem İngilizce arama desteği
 */

import { tmdbApi } from '../tmdb.api';
import type { Movies } from '../../types/Movies';
import type { Tvs } from '../../types/tvs';
import type { PopularPersons } from '../../types/popularPersons';
import type { SearchResults, MultiSearchResults } from '../../types/search';
import { TMDB_CONFIG } from '../../utils/constants';

const API_KEY = TMDB_CONFIG.API_KEY;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

export const searchApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Film araması (Türkçe)
    searchMovies: builder.query<Movies, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/movie?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Film araması (İngilizce)
    searchMoviesEN: builder.query<Movies, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Dizi araması (Türkçe)
    searchTVShows: builder.query<Tvs, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/tv?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Dizi araması (İngilizce)
    searchTVShowsEN: builder.query<Tvs, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/tv?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Çoklu arama (Film + Dizi + Kişi) - Türkçe
    searchMulti: builder.query<MultiSearchResults, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/multi?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Çoklu arama (Film + Dizi + Kişi) - İngilizce
    searchMultiEN: builder.query<MultiSearchResults, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    }),

    // Collection araması
    searchCollections: builder.query<any, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/collection?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}`,
    }),

    // Keyword araması
    searchKeywords: builder.query<any, { query: string; page?: number }>({
      query: ({ query, page = 1 }) =>
        `/search/keyword?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
    }),

    // Trending items (for search suggestions)
    getTrendingForSearch: builder.query<MultiSearchResults, void>({
      query: () =>
        `/trending/all/day?api_key=${API_KEY}&language=${LANGUAGE}`,
      keepUnusedDataFor: 3600, // Cache for 1 hour
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
  useLazySearchMoviesQuery,
  useLazySearchMoviesENQuery,
  useLazySearchTVShowsQuery,
  useLazySearchTVShowsENQuery,
  useLazySearchMultiQuery,
  useLazySearchMultiENQuery,
} = searchApi;

