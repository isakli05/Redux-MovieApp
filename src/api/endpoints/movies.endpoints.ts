/**
 * TMDB API - Movie Endpoints
 * Film ile ilgili tüm API çağrıları
 */

import { tmdbApi } from '../tmdb.api';
import type { Movies } from '../../types/Movies';
import type { MovieDetails } from '../../types/movieDetails';
import type { MovieCredits } from '../../types/movieCredits';
import type { MovieCollect } from '../../types/movieCollect';
import type { VideosResponse } from '../../types/videos';
import { TMDB_CONFIG } from '../../utils/constants';

const API_KEY = TMDB_CONFIG.API_KEY;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

export const moviesApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Popüler filmler - v3 API Key ile
    getPopularMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/popular?language=${LANGUAGE}&page=${page}`,
      providesTags: (result, error, page) => 
        result 
          ? [
              ...result.results.map(({ id }) => ({ type: 'Movie' as const, id })),
              { type: 'Movie', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Movie', id: 'PARTIAL-LIST' }],
    }),

    // Gösterimdeki filmler - v3 API Key ile
    getNowPlayingMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/now_playing?language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'Movie', id: 'NOW-PLAYING' }],
    }),

    // Yakında gelecek filmler - v3 API Key ile
    getUpcomingMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/upcoming?language=${LANGUAGE}&page=${page}`,
      providesTags: [{ type: 'Movie', id: 'UPCOMING' }],
    }),

    // Film detayı - v3 API Key ile
    getMovieDetails: builder.query<MovieDetails, string>({
      query: (movieId) => 
        `/movie/${movieId}?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'MovieDetail', id }],
    }),

    // Film kadrosu ve ekip - v3 API Key ile
    getMovieCredits: builder.query<MovieCredits, string>({
      query: (movieId) => 
        `/movie/${movieId}/credits?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Credits', id: `movie-${id}` }],
    }),

    // Film koleksiyonu - v3 API Key ile
    getMovieCollection: builder.query<MovieCollect, string>({
      query: (collectionId) => 
        `/collection/${collectionId}?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Collection', id }],
    }),

    // Film önerileri - v3 API Key ile
    getMovieRecommendations: builder.query<Movies, string>({
      query: (movieId) => 
        `/movie/${movieId}/recommendations?language=${LANGUAGE}`,
    }),

    // Benzer filmler - v3 API Key ile
    getSimilarMovies: builder.query<Movies, string>({
      query: (movieId) => 
        `/movie/${movieId}/similar?language=${LANGUAGE}`,
    }),

    // Keyword'e göre filmler - v3 API Key ile
    getMoviesByKeyword: builder.query<Movies, { keywordId: string; page?: number }>({
      query: ({ keywordId, page = 1 }) => 
        `/discover/movie?language=${LANGUAGE}&with_keywords=${keywordId}&page=${page}`,
    }),

    // Discover movies (filtreleme için) - v3 API Key ile
    discoverMovies: builder.query<Movies, { watchType?: string; page?: number }>({
      query: ({ watchType = 'with_watch_monetization_types=flatrate', page = 1 }) => 
        `/discover/movie?language=${LANGUAGE}&page=${page}&${watchType}`,
    }),

    // Free to watch movies - v3 API Key ile
    getFreeMovies: builder.query<Movies, void>({
      query: () => 
        `/movie/popular?language=${LANGUAGE}&page=1`,
    }),

    // Trending (all media types) - v3 API Key ile
    getTrending: builder.query<Movies, 'day' | 'week'>({
      query: (timeWindow = 'day') => 
        `/trending/all/${timeWindow}?language=${LANGUAGE}`,
    }),

    // Film videoları (fragmanlar, teaser'lar vb.) - v3 API Key ile
    getMovieVideos: builder.query<VideosResponse, string>({
      query: (movieId) => 
        `/movie/${movieId}/videos?language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Movie', id: `videos-${id}` }],
    }),
  }),
});

// Export hooks
export const {
  useGetPopularMoviesQuery,
  useGetNowPlayingMoviesQuery,
  useGetUpcomingMoviesQuery,
  useGetMovieDetailsQuery,
  useGetMovieCreditsQuery,
  useGetMovieCollectionQuery,
  useGetMovieRecommendationsQuery,
  useGetSimilarMoviesQuery,
  useGetMoviesByKeywordQuery,
  useDiscoverMoviesQuery,
  useGetFreeMoviesQuery,
  useGetTrendingQuery,
  useGetMovieVideosQuery,
} = moviesApi;

