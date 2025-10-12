/**
 * TMDB API v4 - Lists Endpoints
 * Kullanıcı listeleri ile ilgili tüm API çağrıları
 * v4'ün yeni özelliği
 */

import { tmdbApi } from '../tmdb.api';
import { TMDB_CONFIG } from '../../utils/constants';

const ACCESS_TOKEN = TMDB_CONFIG.ACCESS_TOKEN;
const LANGUAGE = TMDB_CONFIG.LANGUAGE;

// Liste tipleri
export interface ListItem {
  media_type: 'movie' | 'tv';
  media_id: number;
  comment?: string;
}

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

export interface AddItemsRequest {
  items: ListItem[];
}

export const listsApi = tmdbApi.injectEndpoints({
  endpoints: (builder) => ({
    // Liste oluşturma
    createList: builder.mutation<{ list_id: string }, CreateListRequest>({
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

    // Liste detayları
    getListDetails: builder.query<List, string>({
      query: (listId) => `/list/${listId}`,
      providesTags: (result, error, id) => [{ type: 'List', id }],
    }),

    // Kullanıcının listeleri
    getUserLists: builder.query<List[], void>({
      query: () => '/account/lists',
      providesTags: [{ type: 'List', id: 'USER-LISTS' }],
    }),

    // Listeye öğe ekleme
    addItemsToList: builder.mutation<{ success: boolean }, { listId: string; items: ListItem[] }>({
      query: ({ listId, items }) => ({
        url: `/list/${listId}/items`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { items },
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Listeden öğe çıkarma
    removeItemsFromList: builder.mutation<{ success: boolean }, { listId: string; items: ListItem[] }>({
      query: ({ listId, items }) => ({
        url: `/list/${listId}/items`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { items },
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Liste güncelleme
    updateList: builder.mutation<{ success: boolean }, { listId: string; name: string; description: string }>({
      query: ({ listId, name, description }) => ({
        url: `/list/${listId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { name, description },
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Liste silme
    deleteList: builder.mutation<{ success: boolean }, string>({
      query: (listId) => ({
        url: `/list/${listId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, listId) => [
        { type: 'List', id: listId },
        { type: 'List', id: 'USER-LISTS' },
      ],
    }),

    // Öğe durumu kontrolü
    checkItemStatus: builder.query<{ item_present: boolean }, { listId: string; mediaId: number; mediaType: 'movie' | 'tv' }>({
      query: ({ listId, mediaId, mediaType }) => 
        `/list/${listId}/item_status?media_id=${mediaId}&media_type=${mediaType}`,
    }),
  }),
});

// Export hooks
export const {
  useCreateListMutation,
  useGetListDetailsQuery,
  useGetUserListsQuery,
  useAddItemsToListMutation,
  useRemoveItemsFromListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useCheckItemStatusQuery,
} = listsApi;
