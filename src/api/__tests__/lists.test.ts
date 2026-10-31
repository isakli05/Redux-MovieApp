import { describe, expect, it } from 'vitest';
import {
  addListItemRequest,
  removeListItemRequest,
  userListsUrl,
} from '../endpoints/lists.endpoints';
import * as listsModule from '../endpoints/lists.endpoints';

describe('getUserLists path (fixes D)', () => {
  it('queries /account/{account_id}/lists with the account id from the arg', () => {
    // getUserLists' query fn is `userListsUrl` — the same builder under test.
    expect(userListsUrl({ accountId: 12345 })).toBe('/account/12345/lists?page=1');
    expect(userListsUrl({ accountId: '42', page: 3 })).toBe('/account/42/lists?page=3');
  });

  it('falls back to the legacy /account/lists path when no account id is given', () => {
    expect(userListsUrl(undefined)).toBe('/account/lists?page=1');
  });
});

describe('v3 list item mutations (fixes C)', () => {
  it('addListItem POSTs form-encoded media_id to /list/{id}/add_item', () => {
    const request = addListItemRequest({ listId: 42, mediaId: 550 });
    expect(request.url).toBe('/list/42/add_item');
    expect(request.method).toBe('POST');
    expect(request.body).toBeInstanceOf(URLSearchParams);
    expect(request.body.get('media_id')).toBe('550');
  });

  it('removeListItem POSTs form-encoded media_id to /list/{id}/remove_item', () => {
    const request = removeListItemRequest({ listId: 42, mediaId: 550 });
    expect(request.url).toBe('/list/42/remove_item');
    expect(request.method).toBe('POST');
    expect(request.body.get('media_id')).toBe('550');
  });

  it('v4-style bulk item mutations and hooks are removed from the module', () => {
    expect('useAddItemsToListMutation' in listsModule).toBe(false);
    expect('useRemoveItemsFromListMutation' in listsModule).toBe(false);
    expect('AddItemsRequest' in listsModule).toBe(false);
  });
});
