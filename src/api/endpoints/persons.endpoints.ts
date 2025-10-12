/**
 * TMDB API - Person Endpoints
 * Kişiler ile ilgili tüm API çağrıları
 */

import { tmdbApi } from '../tmdb.api';
import type { PopularPersons } from '../../types/popularPersons';
import type { PersonDetail } from '../../types/personDetail';
import { TMDB_CONFIG } from '../../utils/constants';

const API_KEY = TMDB_CONFIG.API_KEY;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

export const personsApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Popüler kişiler - v3 API Key ile
    getPopularPersons: builder.query<PopularPersons, number | void>({
      query: (page = 1) => 
        `/person/popular?language=${LANGUAGE}&page=${page}`,
      providesTags: (result) => 
        result 
          ? [
              ...result.results.map(({ id }) => ({ type: 'Person' as const, id })),
              { type: 'Person', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Person', id: 'PARTIAL-LIST' }],
    }),

    // Kişi detayı - v3 API Key ile
    getPersonDetails: builder.query<PersonDetail, string>({
      query: (personId) => 
        `/person/${personId}?language=${LANGUAGE}&append_to_response=movie_credits,tv_credits,images,external_ids`,
      providesTags: (result, error, id) => [{ type: 'PersonDetail', id }],
    }),

    // Kişinin film kredileri - v3 API Key ile
    getPersonMovieCredits: builder.query<any, string>({
      query: (personId) => 
        `/person/${personId}/movie_credits?language=${LANGUAGE}`,
    }),

    // Kişinin TV kredileri - v3 API Key ile
    getPersonTVCredits: builder.query<any, string>({
      query: (personId) => 
        `/person/${personId}/tv_credits?language=${LANGUAGE}`,
    }),

    // Kişi araması - v3 API Key ile
    searchPersons: builder.query<PopularPersons, { query: string; page?: number }>({
      query: ({ query, page = 1 }) => 
        `/search/person?language=${LANGUAGE}&query=${encodeURIComponent(query)}&page=${page}`,
    }),
  }),
});

// Export hooks
export const {
  useGetPopularPersonsQuery,
  useGetPersonDetailsQuery,
  useGetPersonMovieCreditsQuery,
  useGetPersonTVCreditsQuery,
  useSearchPersonsQuery,
} = personsApi;

