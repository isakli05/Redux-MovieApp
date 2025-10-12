/**
 * TMDB API v3 - Authentication Endpoints
 * Kullanıcı authentication için API çağrıları
 */

import { tmdbApi } from '../tmdb.api';
import { TMDB_CONFIG } from '../../utils/constants';

const ACCESS_TOKEN = TMDB_CONFIG.ACCESS_TOKEN;

export interface RequestTokenResponse {
  request_token: string;
  expires_at: string;
}

export interface AccessTokenResponse {
  session_id: string;
  success: boolean;
}

export interface UserAccount {
  id: number;
  username: string;
  name: string;
  include_adult: boolean;
  iso_639_1: string;
  iso_3166_1: string;
}

export const authApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Request token oluşturma (Step 1) - v3 API
    createRequestToken: builder.mutation<RequestTokenResponse, { redirect_to?: string }>({
      query: (data) => ({
        url: `/authentication/token/new`,
        method: 'GET',
      }),
    }),

    // Access token oluşturma (Step 3) - v3 API
    // TMDB'de onaylanmış token ile session oluşturur
    createAccessToken: builder.mutation<AccessTokenResponse, { request_token: string }>({
      query: ({ request_token }) => ({
        url: `/authentication/session/new`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { 
          request_token
        },
      }),
    }),

    // Kullanıcı hesap bilgileri - v3 API
    // Session ID ile kullanıcı bilgilerini getirir
    getAccountDetails: builder.query<UserAccount, { session_id: string }>({
      query: ({ session_id }) => `/account?session_id=${session_id}`,
      providesTags: [{ type: 'User', id: 'ACCOUNT' }],
    }),

    // Logout - v3 API
    logout: builder.mutation<{ success: boolean }, { session_id: string }>({
      query: ({ session_id }) => ({
        url: `/authentication/session`,
        method: 'DELETE',
        body: {
          session_id
        },
      }),
      invalidatesTags: [{ type: 'User', id: 'ACCOUNT' }],
    }),
  }),
});

// Export hooks
export const {
  useCreateRequestTokenMutation,
  useCreateAccessTokenMutation,
  useGetAccountDetailsQuery,
  useLogoutMutation,
} = authApi;
