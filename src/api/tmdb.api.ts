/**
 * TMDB API - RTK Query Base Configuration (v3 only, decision D1)
 * Tüm API endpoint'leri buradan inject edilir.
 *
 * - api_key: production'da query param olarak eklenir; development'ta Vite
 *   proxy (vite.config.ts) server-side enjekte eder.
 * - session_id: localStorage'daki `tmdb_user` içinde varsa eklenir (v3 user auth).
 * - Hatalar tek tipleştirilir: RTK `{ status?, data? }` error + TMDB `status_code`
 *   (429 dahil) yukarı taşınır; otomatik retry YOKTUR — çağıran katmanın kararı.
 *   (BFF'e geçiş Wave 4'te; bu dosya şimdilik client-direct kalır.)
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query';
import { TMDB_CONFIG } from '@utils/constants';

/** TMDB v3 hata gövdesi: { success?, status_code, status_message }. */
export interface TmdbApiError {
  success?: boolean;
  status_code?: number;
  status_message?: string;
}

/** Çağıranların göreceği normalize edilmiş RTK Query error şekli. */
export interface TmdbQueryError {
  status?:
    | number
    | 'FETCH_ERROR'
    | 'PARSING_ERROR'
    | 'CUSTOM_ERROR'
    | 'TIMEOUT_ERROR';
  data?: TmdbApiError;
  error?: string;
  originalError?: unknown;
}

/** localStorage'dan session_id oku; bozuk/eksik veride sessizce null döner. */
export const readSessionId = (): string | null => {
  try {
    const savedUser = localStorage.getItem('tmdb_user');
    if (!savedUser) return null;
    const userData = JSON.parse(savedUser) as { session_id?: string | null } | null;
    return userData?.session_id ?? null;
  } catch {
    return null;
  }
};

/** URL'e api_key (sadece production) ve session_id (varsa) ekler. */
const withAuthParams = (url: string, sessionId: string | null): string => {
  let next = url;
  if (import.meta.env.PROD && TMDB_CONFIG.API_KEY) {
    next += `${next.includes('?') ? '&' : '?'}api_key=${TMDB_CONFIG.API_KEY}`;
  }
  if (sessionId) {
    next += `${next.includes('?') ? '&' : '?'}session_id=${sessionId}`;
  }
  return next;
};

const rawBaseQuery = fetchBaseQuery({ baseUrl: TMDB_CONFIG.BASE_URL });

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, TmdbQueryError> =
  async (args, api, extraOptions) => {
    const sessionId = readSessionId();

    if (typeof args === 'string') {
      args = withAuthParams(args, sessionId);
    } else if (args?.url) {
      args = { ...args, url: withAuthParams(args.url, sessionId) };
    }

    const result = await rawBaseQuery(args, api, extraOptions);

    if ('error' in result && result.error) {
      const { status, data } = result.error;
      const payload = (
        typeof data === 'object' && data !== null ? data : {}
      ) as TmdbApiError;

      // 429 (rate limit) dahil tüm HTTP hataları status_code ile yukarı taşınır;
      // otomatik retry YOKTUR (docs/transformation/TMDB_CAPABILITIES.md).
      const normalized: TmdbQueryError = {
        status,
        data: {
          ...payload,
          status_code:
            typeof payload.status_code === 'number'
              ? payload.status_code
              : typeof status === 'number'
                ? status
                : undefined,
          status_message:
            payload.status_message ??
            (status === 429
              ? 'Rate limit exceeded (HTTP 429). Back off and retry explicitly.'
              : typeof data === 'string'
                ? data
                : undefined),
        },
        error: typeof data === 'string' ? data : undefined,
        originalError: result.error,
      };

      return { error: normalized };
    }

    return result;
  };

// Base API
export const tmdbApi = createApi({
  reducerPath: 'tmdbApi',
  baseQuery,
  tagTypes: [
    'Movie', 'MovieDetail', 'TV', 'TVDetail', 'Person', 'PersonDetail',
    'Credits', 'Collection', 'List', 'User', 'SeasonVideos', 'SeasonCredits',
    'Media', 'Provider', 'Region',
  ],
  endpoints: () => ({}),
});
