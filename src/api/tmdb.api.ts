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

// Wrap base query to add api_key and session_id to requests
const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const isProduction = import.meta.env.PROD;
  
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

  // URL'yi düzenle - api_key ve session_id ekle
  if (typeof args === 'string') {
    let url = args;
    const separator = url.includes('?') ? '&' : '?';
    
    // Production'da API key ekle (development'ta proxy ekliyor)
    if (isProduction && TMDB_CONFIG.API_KEY) {
      url = `${url}${separator}api_key=${TMDB_CONFIG.API_KEY}`;
    }
    
    // Session ID varsa ekle
    if (sessionId) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}session_id=${sessionId}`;
    }
    
    args = url;
  } else if (args.url) {
    let url = args.url;
    const separator = url.includes('?') ? '&' : '?';
    
    // Production'da API key ekle (development'ta proxy ekliyor)
    if (isProduction && TMDB_CONFIG.API_KEY) {
      url = `${url}${separator}api_key=${TMDB_CONFIG.API_KEY}`;
    }
    
    // Session ID varsa ekle
    if (sessionId) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}session_id=${sessionId}`;
    }
    
    args = { ...args, url };
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

