/**
 * TMDB API - Media Endpoints
 * Image endpoints for movies, TV shows, seasons, and persons
 */

import { tmdbApi } from '../tmdb.api';
import type { ImagesResponse, PersonImagesResponse } from '../../types/media';

export const mediaApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Movie Images
    getMovieImages: builder.query<ImagesResponse, string>({
      query: (movieId) => `/movie/${movieId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `movie-${id}` }],
    }),

    // TV Show Images
    getTVImages: builder.query<ImagesResponse, string>({
      query: (tvId) => `/tv/${tvId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `tv-${id}` }],
    }),

    // Season Images
    getSeasonImages: builder.query<ImagesResponse, { tvId: string; seasonNumber: number }>({
      query: ({ tvId, seasonNumber }) => 
        `/tv/${tvId}/season/${seasonNumber}/images`,
      providesTags: (result, error, { tvId, seasonNumber }) => [
        { type: 'Media', id: `season-${tvId}-${seasonNumber}` }
      ],
    }),

    // Person Images
    getPersonImages: builder.query<PersonImagesResponse, string>({
      query: (personId) => `/person/${personId}/images`,
      providesTags: (result, error, id) => [{ type: 'Media', id: `person-${id}` }],
    }),
  }),
});

// Export hooks
export const {
  useGetMovieImagesQuery,
  useGetTVImagesQuery,
  useGetSeasonImagesQuery,
  useGetPersonImagesQuery,
} = mediaApi;
