/**
 * TMDB API v3 - Movie Endpoints
 * Film ile ilgili tüm API çağrıları (v3 only — D1)
 */

import { tmdbApi } from '../tmdb.api';
import type { Movies } from '../../types/Movies';
import type { MovieDetails } from '../../types/movieDetails';
import type { MovieCredits } from '../../types/movieCredits';
import type { MovieCollect } from '../../types/movieCollect';
import type { VideosResponse } from '../../types/videos';
import type { MovieDetailFull } from '../../types/detailFull';
import type { MediaSummary, TrendingRawItem } from '../../types/mediaSummary';
import { toMediaSummary } from '../../types/mediaSummary';
import { freeWatchUrl } from '../../types/discover';
import type { FreeWatchArgs } from '../../types/discover';
import { TMDB_CONFIG } from '../../utils/constants';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

// ---------------------------------------------------------------------------
// Trending /all normalization (D5 — fixes E/G at the API boundary)
// ---------------------------------------------------------------------------

/** Raw `/trending/all/{tw}` list shape before normalization. */
export interface TrendingAllRawResponse {
  page: number;
  results: TrendingRawItem[];
  total_pages: number;
  total_results: number;
}

/** Normalized, paginated page of MediaSummary items (movie|tv|person union). */
export interface MediaSummaryPage {
  page: number;
  results: MediaSummary[];
  total_pages: number;
}

/** Map a raw trending/all page into MediaSummary items; never throws. */
export const mapTrendingAllResponse = (raw: TrendingAllRawResponse): MediaSummaryPage => ({
  page: raw.page,
  results: Array.isArray(raw.results) ? raw.results.map(toMediaSummary) : [],
  total_pages: raw.total_pages,
});

/** URL builder for getTrendingMixed (exported for URL-construction tests). */
export const trendingAllUrl = ({ timeWindow = 'day', page = 1 }: { timeWindow?: 'day' | 'week'; page?: number }): string =>
  `/trending/all/${timeWindow}?language=${LANGUAGE}&page=${page}`;

// 10 appends (max 20) — see src/types/detailFull.ts header for the list.
const MOVIE_APPENDS = [
  'credits',
  'videos',
  'images',
  'recommendations',
  'similar',
  'release_dates',
  'watch/providers',
  'external_ids',
  'keywords',
  'translations',
].join(',');

export const moviesApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Popüler filmler - v3 API Key ile
    getPopularMovies: builder.query<Movies, number | void>({
      query: (page = 1) =>
        `/movie/popular?language=${LANGUAGE}&page=${page}`,
      providesTags: (result, _error, _page) =>
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
      providesTags: (result, _error, id) => [{ type: 'MovieDetail', id }],
    }),

    /**
     * Full movie detail in one request via append_to_response (10 appends):
     * credits, videos, images (tr,en,null), recommendations, similar,
     * release_dates, watch/providers, external_ids, keywords, translations.
     */
    getMovieDetailFull: builder.query<MovieDetailFull, string>({
      query: (movieId) =>
        `/movie/${movieId}?language=${LANGUAGE}` +
        `&append_to_response=${MOVIE_APPENDS}` +
        '&include_image_language=tr,en,null',
      providesTags: (result, _error, id) => [
        { type: 'MovieDetail', id },
        ...(result
          ? [
              { type: 'Credits' as const, id: `movie-${id}` },
              { type: 'Media' as const, id: `movie-${id}` },
            ]
          : []),
      ],
    }),

    // Film kadrosu ve ekip - v3 API Key ile
    getMovieCredits: builder.query<MovieCredits, string>({
      query: (movieId) =>
        `/movie/${movieId}/credits?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'Credits', id: `movie-${id}` }],
    }),

    // Film koleksiyonu - v3 API Key ile
    getMovieCollection: builder.query<MovieCollect, string>({
      query: (collectionId) =>
        `/collection/${collectionId}?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'Collection', id }],
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
    /** @deprecated free/region-aware discovery için getFreeToWatchMovies veya
     *  yeni discover endpoint'lerini kullanın; watch filtreleri region'sız
     *  anlamsızdır (defect I). */
    discoverMovies: builder.query<Movies, { watchType?: string; page?: number }>({
      query: ({ watchType = 'with_watch_monetization_types=flatrate', page = 1 }) =>
        `/discover/movie?language=${LANGUAGE}&page=${page}&${watchType}`,
    }),

    /**
     * Gerçekten ücretsiz filmler (fixes H): discover + with_watch_monetization_types=free.
     * `region` ZORUNLUDUR (TMDB'nin varsayılan watch_region'u yoktur — fix I);
     * çağrı yerinde useRegion().region ile geçirilmelidir.
     */
    getFreeToWatchMovies: builder.query<Movies, FreeWatchArgs>({
      query: (args) => freeWatchUrl('movie', args),
      providesTags: [{ type: 'Movie', id: 'FREE-TO-WATCH' }],
    }),

    /**
     * @deprecated Bu endpoint `/movie/popular` passthrough'udur ve filtreleme
     * yapmaz — dönen içerik ücretsiz DEĞİLDİR (defect H). Yeni kod
     * `getFreeToWatchMovies({ region, page })` kullanmalıdır. Home rewrite
     * inene kadar mevcut Free.tsx derlemesi için tutuldu.
     */
    getFreeMovies: builder.query<Movies, void>({
      query: () =>
        `/movie/popular?language=${LANGUAGE}&page=1`,
    }),

    /**
     * Karma trending (D5, fixes E/G): `/trending/all/{tw}` sonucunu
     * media_type discriminant'ıyla MediaSummary'e normalize eder.
     */
    getTrendingMixed: builder.query<
      MediaSummaryPage,
      { timeWindow: 'day' | 'week'; page?: number }
    >({
      query: trendingAllUrl,
      transformResponse: mapTrendingAllResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ media_type, id }) => ({
                type: 'Media' as const,
                id: `${media_type}-${id}`,
              })),
              { type: 'Media', id: 'TRENDING-MIXED' },
            ]
          : [{ type: 'Media', id: 'TRENDING-MIXED' }],
    }),

    /**
     * @deprecated use getTrendingMixed — ham Movies şekli döndürür ve tv/person
     * satırlarını yanlış tipler (defects E/G). Home rewrite inene kadar tutuldu.
     */
    getTrending: builder.query<Movies, 'day' | 'week'>({
      query: (timeWindow = 'day') =>
        `/trending/all/${timeWindow}?language=${LANGUAGE}`,
    }),

    // Film videoları (fragmanlar, teaser'lar vb.) - v3 API Key ile
    getMovieVideos: builder.query<VideosResponse, string>({
      query: (movieId) =>
        `/movie/${movieId}/videos?language=${LANGUAGE}`,
      providesTags: (result, _error, id) => [{ type: 'Movie', id: `videos-${id}` }],
    }),
  }),
});

// Export hooks
export const {
  useGetPopularMoviesQuery,
  useGetNowPlayingMoviesQuery,
  useGetUpcomingMoviesQuery,
  useGetMovieDetailsQuery,
  useGetMovieDetailFullQuery,
  useGetMovieCreditsQuery,
  useGetMovieCollectionQuery,
  useGetMovieRecommendationsQuery,
  useGetSimilarMoviesQuery,
  useGetMoviesByKeywordQuery,
  useDiscoverMoviesQuery,
  useGetFreeToWatchMoviesQuery,
  useGetFreeMoviesQuery,
  useGetTrendingMixedQuery,
  useGetTrendingQuery,
  useGetMovieVideosQuery,
} = moviesApi;
