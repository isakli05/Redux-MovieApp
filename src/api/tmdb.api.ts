/**
 * TMDB API - RTK Query Base Configuration
 * Tüm API endpoint'leri burada tanımlanır
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TMDB_CONFIG } from '@utils/constants';

// Base query configuration
const baseQuery = fetchBaseQuery({
  baseUrl: TMDB_CONFIG.BASE_URL,
  prepareHeaders: (headers) => {
    // API Key'i query parameter olarak ekle
    return headers;
  },
});

// Base API
export const tmdbApi = createApi({
  reducerPath: 'tmdbApi',
  baseQuery,
  tagTypes: ['Movie', 'MovieDetail', 'TV', 'TVDetail', 'Person', 'PersonDetail', 'Credits', 'Collection'],
  endpoints: () => ({}),
});

