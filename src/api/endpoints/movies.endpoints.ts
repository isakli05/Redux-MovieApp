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
    // Popüler filmler
    getPopularMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}&adult=false`,
      providesTags: (result, error, page) => 
        result 
          ? [
              ...result.results.map(({ id }) => ({ type: 'Movie' as const, id })),
              { type: 'Movie', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Movie', id: 'PARTIAL-LIST' }],
    }),

    // Gösterimdeki filmler
    getNowPlayingMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/now_playing?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}&adult=false`,
      providesTags: [{ type: 'Movie', id: 'NOW-PLAYING' }],
    }),

    // Yakında gelecek filmler
    getUpcomingMovies: builder.query<Movies, number | void>({
      query: (page = 1) => 
        `/movie/upcoming?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}&adult=false`,
      providesTags: [{ type: 'Movie', id: 'UPCOMING' }],
    }),

    // Film detayı
    getMovieDetails: builder.query<MovieDetails, string>({
      query: (movieId) => 
        `/movie/${movieId}?api_key=${API_KEY}&language=${LANGUAGE}&adult=false`,
      providesTags: (result, error, id) => [{ type: 'MovieDetail', id }],
    }),

    // Film kadrosu ve ekip
    getMovieCredits: builder.query<MovieCredits, string>({
      query: (movieId) => 
        `/movie/${movieId}/credits?api_key=${API_KEY}&language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Credits', id: `movie-${id}` }],
    }),

    // Film koleksiyonu
    getMovieCollection: builder.query<MovieCollect, string>({
      query: (collectionId) => 
        `/collection/${collectionId}?api_key=${API_KEY}&language=${LANGUAGE}`,
      providesTags: (result, error, id) => [{ type: 'Collection', id }],
    }),

    // Film önerileri
    getMovieRecommendations: builder.query<Movies, string>({
      query: (movieId) => 
        `/movie/${movieId}/recommendations?api_key=${API_KEY}&language=${LANGUAGE}`,
    }),

    // Benzer filmler
    getSimilarMovies: builder.query<Movies, string>({
      query: (movieId) => 
        `/movie/${movieId}/similar?api_key=${API_KEY}&language=${LANGUAGE}`,
    }),

    // Keyword'e göre filmler
    getMoviesByKeyword: builder.query<Movies, { keywordId: string; page?: number }>({
      query: ({ keywordId, page = 1 }) => 
        `/discover/movie?api_key=${API_KEY}&language=${LANGUAGE}&with_keywords=${keywordId}&page=${page}`,
    }),

    // Discover movies (filtreleme için)
    discoverMovies: builder.query<Movies, { watchType?: string; page?: number }>({
      query: ({ watchType = 'with_watch_monetization_types=flatrate', page = 1 }) => 
        `/discover/movie?api_key=${API_KEY}&watch_region=US&${watchType}&page=${page}`,
    }),

    // Free to watch movies
    getFreeMovies: builder.query<Movies, void>({
      query: () => 
        `/discover/movie?api_key=${API_KEY}&watch_region=US&with_watch_monetization_types=free`,
    }),

    // Trending (all media types)
    getTrending: builder.query<Movies, 'day' | 'week'>({
      query: (timeWindow = 'day') => 
        `/trending/all/${timeWindow}?api_key=${API_KEY}`,
    }),

    // Film videoları (fragmanlar, teaser'lar vb.)
    getMovieVideos: builder.query<VideosResponse, string>({
      query: (movieId) => 
        `/movie/${movieId}/videos?api_key=${API_KEY}&language=${LANGUAGE}`,
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

