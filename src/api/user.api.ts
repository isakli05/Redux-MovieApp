/**
 * User-surface RTK Query slice — same-origin BFF (`/api`) client.
 *
 * Decision D1 (docs/transformation/SECURITY_REMEDIATION.md): all
 * authenticated traffic (auth, lists, favorites, watchlist, ratings) goes
 * through the Netlify Functions BFF. The v3 session lives in the httpOnly
 * `tmdb_session` cookie, so this slice never touches a session credential —
 * requests are same-origin and the browser attaches the cookie automatically.
 *
 * `x-requested-with: fetch` is sent on every request: the BFF requires it on
 * mutations (CSRF check paired with the SameSite=Lax cookie).
 *
 * v3 constraint (D1): lists are movie-only; `mediaId` is a TMDB movie id.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/** Display-only account shape returned by GET /api/auth/session. */
export interface UserAccount {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

export interface SessionResponse {
  authenticated: boolean;
  account?: UserAccount;
}

/** v3 `/account/{account_id}/lists` sonuç öğesi. */
export interface AccountListSummary {
  id: number;
  name: string;
  description: string;
  favorite_count: number;
  item_count: number;
  iso_639_1: string;
  poster_path: string | null;
  sort_by?: string;
  created_at?: string;
  updated_at?: string;
}

/** Sayfalanmış kullanıcı listeleri yanıtı. */
export interface UserListsPage {
  page: number;
  results: AccountListSummary[];
  total_pages: number;
  total_results: number;
}

/** v3 liste öğesi (film-only — D1 kısıtı). */
export interface ListDetailItem {
  id: number;
  media_type: 'movie';
  title?: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  overview?: string;
  popularity?: number;
}

/** `GET /api/lists/:id` yanıtı — TMDB `/3/list/{id}` şekli. */
export interface ListDetail {
  id: number;
  name: string;
  description: string;
  created_by: string;
  favorite_count: number;
  item_count: number;
  iso_639_1: string;
  public: boolean;
  page: number;
  total_pages: number;
  total_results: number;
  items: ListDetailItem[];
}

export interface CreateListRequest {
  name: string;
  description: string;
  language?: string;
}

/** Liste öğesi mutasyon arg shape (mediaId = TMDB film id). */
export interface ListItemMutationArgs {
  listId: number | string;
  mediaId: number;
}

/** v3 liste yazma mutasyonlarının ortak (sanitize edilmiş) yanıtı. */
export interface ListMutationResponse {
  success: boolean;
  status_code?: number;
}

export type AccountMediaType = 'movie' | 'tv';

/** Sayfalanmış hesap içerik listesi (favoriler/izleme listesi/puanlananlar). */
export interface AccountMediaPage {
  page: number;
  results: ListDetailItem[];
  total_pages: number;
  total_results: number;
}

/** Sanitized BFF error body. */
export interface BffError {
  error: { code: string; message?: string; status_code?: number };
}

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'same-origin',
  prepareHeaders: (headers) => {
    headers.set('x-requested-with', 'fetch');
    return headers;
  },
});

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['Lists', 'List', 'Account'],
  endpoints: (builder) => ({
    // GET /api/auth/session — auth boot (fixes M; see useAuth).
    getSession: builder.query<SessionResponse, void>({
      query: () => 'auth/session',
      providesTags: ['Account'],
    }),

    // GET /api/lists?accountId=&page=
    getUserLists: builder.query<UserListsPage, { accountId: number | string; page?: number }>({
      query: ({ accountId, page = 1 }) => `/lists?accountId=${accountId}&page=${page}`,
      providesTags: [{ type: 'Lists', id: 'USER-LISTS' }],
    }),

    // GET /api/lists/:id?page=
    getListDetails: builder.query<ListDetail, { id: number | string; page?: number }>({
      query: ({ id, page = 1 }) => `/lists/${id}?page=${page}`,
      providesTags: (_result, _error, { id }) => [{ type: 'List', id: String(id) }],
    }),

    // POST /api/lists
    createList: builder.mutation<{ list_id: number; success: boolean }, CreateListRequest>({
      query: (body) => ({ url: 'lists', method: 'POST', body }),
      invalidatesTags: [{ type: 'Lists', id: 'USER-LISTS' }],
    }),

    // POST /api/lists/:id/update
    updateList: builder.mutation<
      { success: boolean },
      { listId: number | string; name: string; description: string }
    >({
      query: ({ listId, name, description }) => ({
        url: `lists/${listId}/update`,
        method: 'POST',
        body: { name, description },
      }),
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: String(listId) },
        { type: 'Lists', id: 'USER-LISTS' },
      ],
    }),

    // DELETE /api/lists/:id?confirm=true (BFF clear+delete)
    deleteList: builder.mutation<{ success: boolean }, number | string>({
      query: (listId) => ({ url: `lists/${listId}?confirm=true`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, listId) => [
        { type: 'List', id: String(listId) },
        { type: 'Lists', id: 'USER-LISTS' },
      ],
    }),

    // POST /api/lists/:id/items {mediaId}  (defect J wiring)
    addListItem: builder.mutation<ListMutationResponse, ListItemMutationArgs>({
      query: ({ listId, mediaId }) => ({
        url: `lists/${listId}/items`,
        method: 'POST',
        body: { mediaId },
      }),
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: String(listId) },
        { type: 'Lists', id: 'USER-LISTS' },
      ],
    }),

    // DELETE /api/lists/:id/items {mediaId} (BFF maps to v3 POST remove_item)
    removeListItem: builder.mutation<ListMutationResponse, ListItemMutationArgs>({
      query: ({ listId, mediaId }) => ({
        url: `lists/${listId}/items`,
        method: 'DELETE',
        body: { mediaId },
      }),
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: String(listId) },
        { type: 'Lists', id: 'USER-LISTS' },
      ],
    }),

    // POST /api/account/favorite
    addFavorite: builder.mutation<
      { success: boolean },
      { mediaType: AccountMediaType; mediaId: number; favorite: boolean }
    >({
      query: (body) => ({ url: 'account/favorite', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),

    // GET /api/account/favorites?mediaType=&page=
    getFavorites: builder.query<AccountMediaPage, { mediaType: AccountMediaType; page?: number }>({
      query: ({ mediaType, page = 1 }) => `/account/favorites?mediaType=${mediaType}&page=${page}`,
      providesTags: ['Account'],
    }),

    // POST /api/account/watchlist
    setWatchlist: builder.mutation<
      { success: boolean },
      { mediaType: AccountMediaType; mediaId: number; watchlist: boolean }
    >({
      query: (body) => ({ url: 'account/watchlist', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),

    // GET /api/account/watchlist?mediaType=&page=
    getWatchlist: builder.query<AccountMediaPage, { mediaType: AccountMediaType; page?: number }>({
      query: ({ mediaType, page = 1 }) => `/account/watchlist?mediaType=${mediaType}&page=${page}`,
      providesTags: ['Account'],
    }),

    // POST /api/account/rating {mediaType, mediaId, value}
    rateMedia: builder.mutation<
      { success: boolean },
      { mediaType: AccountMediaType; mediaId: number; value: number }
    >({
      query: (body) => ({ url: 'account/rating', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),

    // DELETE /api/account/rating {mediaType, mediaId}
    deleteRating: builder.mutation<
      { success: boolean },
      { mediaType: AccountMediaType; mediaId: number }
    >({
      query: (body) => ({ url: 'account/rating', method: 'DELETE', body }),
      invalidatesTags: ['Account'],
    }),

    // GET /api/account/rated?mediaType=&page=
    getRated: builder.query<AccountMediaPage, { mediaType: AccountMediaType; page?: number }>({
      query: ({ mediaType, page = 1 }) => `/account/rated?mediaType=${mediaType}&page=${page}`,
      providesTags: ['Account'],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useGetUserListsQuery,
  useGetListDetailsQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useAddListItemMutation,
  useRemoveListItemMutation,
  useAddFavoriteMutation,
  useGetFavoritesQuery,
  useSetWatchlistMutation,
  useGetWatchlistQuery,
  useRateMediaMutation,
  useDeleteRatingMutation,
  useGetRatedQuery,
} = userApi;
