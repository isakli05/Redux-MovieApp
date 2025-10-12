/**
 * TMDB API - RTK Query Base Configuration
 * Tüm API endpoint'leri burada tanımlanır
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TMDB_CONFIG } from '@utils/constants';

// Base query configuration
const rawBaseQuery = fetchBaseQuery({
  baseUrl: TMDB_CONFIG.BASE_URL,
  prepareHeaders: (headers) => {
    return headers;
  },
});

// Wrap base query to add session_id to authenticated requests
const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  // Session ID'yi local storage'dan al
  const savedUser = localStorage.getItem('tmdb_user');
  let sessionId: string | null = null;
  
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      sessionId = userData.session_id;
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  // URL'yi düzenle - session_id ekle
  if (typeof args === 'string') {
    if (sessionId) {
      const separator = args.includes('?') ? '&' : '?';
      args = `${args}${separator}session_id=${sessionId}`;
    }
  } else if (args.url) {
    if (sessionId) {
      const separator = args.url.includes('?') ? '&' : '?';
      args.url = `${args.url}${separator}session_id=${sessionId}`;
    }
  }

  return rawBaseQuery(args, api, extraOptions);
};

// Base API
export const tmdbApi = createApi({
  reducerPath: 'tmdbApi',
  baseQuery,
  tagTypes: ['Movie', 'MovieDetail', 'TV', 'TVDetail', 'Person', 'PersonDetail', 'Credits', 'Collection', 'List', 'User'],
  endpoints: () => ({}),
});

