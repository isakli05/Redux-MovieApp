/**
 * TMDB API v3 - Lists Endpoints (v3 only — D1; fixes C + D)
 * Kullanıcı listeleri ile ilgili tüm API çağrıları.
 *
 * - v4 tarzı toplu (`/list/{id}/items` + items[] JSON body + DELETE) mutasyonlar
 *   KALDIRILDI (fixes C): v3 tekil formlar `add_item`/`remove_item` kullanılır.
 * - `getUserLists` artık doğru v3 yolu `/account/{account_id}/lists` (fixes D);
 *   session_id baseQuery tarafından otomatik eklenir.
 * - v3 listeler SADECE film destekler (D1 kısıtı — mixed lists deferred).
 */

import { tmdbApi } from '../tmdb.api';
import { TMDB_CONFIG } from '../../utils/constants';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

/** v3 liste öğesi tanımı (film-only). */
export interface ListItem {
  media_type: 'movie' | 'tv';
  media_id: number;
  comment?: string;
}

/** Liste detayı (`/list/{id}`) — mevcut UI bu şekli tüketiyor, korunur. */
export interface List {
  id: string;
  name: string;
  description: string;
  language: string;
  public: boolean;
  item_count: number;
  created_by: string;
  items: ListItem[];
}

export interface CreateListRequest {
  name: string;
  description: string;
  language?: string;
  public?: boolean;
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

/** Sayfalanmış kullanıcı listeleri yanıtı (fixes D). */
export interface UserListsPage {
  page: number;
  results: AccountListSummary[];
  total_pages: number;
  total_results: number;
}

/** v3 liste yazma mutasyonlarının ortak yanıtı. */
export interface ListMutationResponse {
  status_code: number;
  status_message: string;
  success?: boolean;
}

/** v3 form-encoded add/remove arg shape (media_id = film TMDB id). */
export interface ListItemMutationArgs {
  listId: string | number;
  mediaId: number;
}

/**
 * URL builder for getUserLists (exported for URL-construction tests).
 * account_id yoksa legacy `/account/lists` fallback'i döner (defect D notu).
 */
export const userListsUrl = (
  arg?: { accountId?: string | number; page?: number } | void,
): string => {
  const { accountId, page = 1 } = arg ?? {};
  const base =
    accountId !== undefined ? `/account/${accountId}/lists` : '/account/lists';
  return `${base}?page=${page}`;
};

/** v3 form request builders for add_item / remove_item (exported for tests). */
export const addListItemRequest = ({ listId, mediaId }: ListItemMutationArgs) => ({
  url: `/list/${listId}/add_item`,
  method: 'POST',
  body: new URLSearchParams({ media_id: String(mediaId) }),
});

export const removeListItemRequest = ({ listId, mediaId }: ListItemMutationArgs) => ({
  url: `/list/${listId}/remove_item`,
  method: 'POST',
  body: new URLSearchParams({ media_id: String(mediaId) }),
});

export const listsApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Liste oluşturma (v3: POST /list)
    createList: builder.mutation<{ list_id: number; success: boolean }, CreateListRequest>({
      query: (listData) => ({
        url: '/list',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: listData.name,
          description: listData.description,
          language: listData.language || LANGUAGE,
          public: listData.public || false,
        },
      }),
      invalidatesTags: [{ type: 'List', id: 'USER-LISTS' }],
    }),

    // Liste detayları (v3)
    getListDetails: builder.query<List, string>({
      query: (listId) => `/list/${listId}`,
      providesTags: (result, _error, id) => [{ type: 'List', id }],
    }),

    /**
     * Kullanıcının listeleri (fixes D): doğru v3 yolu
     * `/account/{account_id}/lists` — account_id parametreden gelir,
     * session_id baseQuery tarafından enjekte edilir.
     *
     * Argüman opsiyoneldir: `{accountId}` verilmeyen eski çağrılar (mevcut
     * UserLists.tsx) legacy `/account/lists` yoluna düşer; Lists sayfası
     * rewrite'ında accountId zorunlu hale getirilecek.
     */
    getUserLists: builder.query<UserListsPage, { accountId: string | number; page?: number } | void>({
      query: userListsUrl,
      providesTags: [{ type: 'List', id: 'USER-LISTS' }],
    }),

    /**
     * Listeye öğe ekleme (fixes C): v3 form `POST /list/{id}/add_item`
     * ile tek `media_id` (film-only). v4 toplu items[] mutasyonu kaldırıldı.
     */
    addListItem: builder.mutation<ListMutationResponse, ListItemMutationArgs>({
      query: addListItemRequest,
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    /**
     * Listeden öğe çıkarma (fixes C): v3 form `POST /list/{id}/remove_item`
     * ile tek `media_id`. (v4 DELETE + JSON body kaldırıldı.)
     */
    removeListItem: builder.mutation<ListMutationResponse, ListItemMutationArgs>({
      query: removeListItemRequest,
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    /**
     * @deprecated Kullanılmıyor ve PUT /list/{id} v3'te belgeli bir endpoint
     * değildir (v4 kalıntısı). Lists rewrite'ında v3 akışına göre ele alınacak.
     */
    updateList: builder.mutation<{ success: boolean }, { listId: string; name: string; description: string }>({
      query: ({ listId, name, description }) => ({
        url: `/list/${listId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { name, description },
      }),
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Liste silme (v3: DELETE /list/{id})
    deleteList: builder.mutation<{ success: boolean }, string>({
      query: (listId) => ({
        url: `/list/${listId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, listId) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Öğe durumu kontrolü (v3: /list/{id}/item_status — v3 listeleri film-only)
    checkItemStatus: builder.query<{ item_present: boolean }, { listId: string; mediaId: number; mediaType?: 'movie' | 'tv' }>({
      query: ({ listId, mediaId, mediaType }) =>
        `/list/${listId}/item_status?media_id=${mediaId}${mediaType ? `&media_type=${mediaType}` : ''}`,
    }),
  }),
});

// Export hooks
export const {
  useCreateListMutation,
  useGetListDetailsQuery,
  useGetUserListsQuery,
  useAddListItemMutation,
  useRemoveListItemMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useCheckItemStatusQuery,
} = listsApi;
