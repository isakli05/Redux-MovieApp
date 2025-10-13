/**
 * TMDB API Constants
 * Environment variable'lardan gelen değerler
 */

// Production'da proxy yok, doğrudan TMDB'ye bağlan
const isProduction = import.meta.env.PROD;
const BASE_URL = isProduction 
  ? 'https://api.themoviedb.org/3'  // Production: doğrudan TMDB
  : '/api/tmdb';                     // Development: Vite proxy

export const TMDB_CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API_KEY,
  ACCESS_TOKEN: import.meta.env.VITE_TMDB_ACCESS_TOKEN, // v4 Bearer token
  BASE_URL,
  IMAGE_BASE_URL: import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p',
  LANGUAGE: import.meta.env.VITE_TMDB_LANGUAGE || 'tr-TR',
} as const;

export const IMAGE_SIZES = {
  POSTER: {
    SMALL: 'w185',
    MEDIUM: 'w342',
    LARGE: 'w500',
    ORIGINAL: 'original',
  },
  BACKDROP: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original',
  },
  PROFILE: {
    SMALL: 'w45',
    MEDIUM: 'w185',
    LARGE: 'h632',
    ORIGINAL: 'original',
  },
} as const;

export const DEFAULT_IMAGES = {
  POSTER: '/assets/tv_null.svg',
  PROFILE: '/assets/nullUser.svg',
} as const;

