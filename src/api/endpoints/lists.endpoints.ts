/**
 * TMDB API v3 - Lists Endpoints (user-surface, BFF rewiring)
 *
 * Wave 4 migration (docs/transformation/SECURITY_REMEDIATION.md, decision D1):
 * every user-surface list call (create/read/update/delete + add/remove item)
 * now runs against the same-origin BFF (`/api/*`) via `src/api/user.api.ts`.
 * The v3 session lives in the httpOnly `tmdb_session` cookie and is injected
 * server-side — this module no longer injects `session_id` into catalog URLs.
 *
 * This file remains as the public import surface (`../api` barrel): it
 * re-exports the user.api types/hooks plus pure request-shape builders that
 * the URL-shape tests assert against. v3 lists are movie-only (D1 kısıtı).
 */

export type {
  AccountListSummary,
  AccountMediaPage,
  AccountMediaType,
  CreateListRequest,
  ListDetail,
  ListDetailItem,
  ListItemMutationArgs,
  ListMutationResponse,
  SessionResponse,
  UserListsPage,
} from '../user.api';

// NOTE: `UserAccount` is intentionally NOT re-exported here — auth.endpoints
// already exports a different interface with that name and a barrel-level
// `export *` collision would silently drop both bindings.

export {
  userApi,
  useAddFavoriteMutation,
  useAddListItemMutation,
  useCreateListMutation,
  useDeleteListMutation,
  useDeleteRatingMutation,
  useGetFavoritesQuery,
  useGetListDetailsQuery,
  useGetRatedQuery,
  useGetSessionQuery,
  useGetUserListsQuery,
  useGetWatchlistQuery,
  useRateMediaMutation,
  useRemoveListItemMutation,
  useSetWatchlistMutation,
  useUpdateListMutation,
} from '../user.api';

/**
 * Pure URL/request builders over the BFF surface (exported for tests).
 * These mirror the `query` fns of the userApi endpoints one-for-one.
 */

/** GET /api/lists?accountId=&page= — account id zorunlu (fixes D). */
export const userListsUrl = (arg?: { accountId?: number | string; page?: number } | void): string => {
  const { accountId, page = 1 } = arg ?? {};
  if (accountId === undefined) return '/lists?page=1';
  return `/lists?accountId=${accountId}&page=${page}`;
};

/** POST /api/lists/:id/items with a JSON {mediaId} body (defect J wiring). */
export const addListItemRequest = ({ listId, mediaId }: ListItemMutationArgsShim) => ({
  url: `/lists/${listId}/items`,
  method: 'POST',
  body: { mediaId },
});

/** DELETE /api/lists/:id/items with a JSON {mediaId} body (BFF maps to v3 POST remove_item). */
export const removeListItemRequest = ({ listId, mediaId }: ListItemMutationArgsShim) => ({
  url: `/lists/${listId}/items`,
  method: 'DELETE',
  body: { mediaId },
});

interface ListItemMutationArgsShim {
  listId: number | string;
  mediaId: number;
}
