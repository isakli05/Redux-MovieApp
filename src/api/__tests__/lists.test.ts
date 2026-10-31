/**
 * Lists request-shape tests (Wave 4: BFF rewiring).
 * The user-surface list calls now target the same-origin /api BFF; these
 * builders mirror the userApi query fns one-for-one.
 */

import { describe, expect, it } from 'vitest';
import {
  addListItemRequest,
  removeListItemRequest,
  userListsUrl,
} from '../endpoints/lists.endpoints';
import * as listsModule from '../endpoints/lists.endpoints';

describe('userListsUrl (BFF: GET /api/lists)', () => {
  it('builds /lists?accountId=&page= with the account id from the arg (fixes D)', () => {
    expect(userListsUrl({ accountId: 12345 })).toBe('/lists?accountId=12345&page=1');
    expect(userListsUrl({ accountId: '42', page: 3 })).toBe('/lists?accountId=42&page=3');
  });

  it('requires an account id (the legacy /account/lists fallback is gone)', () => {
    expect(userListsUrl(undefined)).toBe('/lists?page=1');
  });
});

describe('list item mutations via the BFF (defect J wiring)', () => {
  it('addListItem POSTs a JSON {mediaId} body to /lists/:id/items', () => {
    const request = addListItemRequest({ listId: 42, mediaId: 550 });
    expect(request.url).toBe('/lists/42/items');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ mediaId: 550 });
  });

  it('removeListItem issues a DELETE with a JSON {mediaId} body (BFF maps to v3 POST remove_item)', () => {
    const request = removeListItemRequest({ listId: 42, mediaId: 550 });
    expect(request.url).toBe('/lists/42/items');
    expect(request.method).toBe('DELETE');
    expect(request.body).toEqual({ mediaId: 550 });
  });

  it('v4-style bulk item mutations and hooks are absent from the module', () => {
    expect('useAddItemsToListMutation' in listsModule).toBe(false);
    expect('useRemoveItemsFromListMutation' in listsModule).toBe(false);
    expect('AddItemsRequest' in listsModule).toBe(false);
  });
});
