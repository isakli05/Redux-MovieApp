/**
 * user.api.ts request-shape tests — every request must target the same-origin
 * /api BFF, carry credentials and the x-requested-with header (CSRF pairing),
 * and never contain a session_id (it lives in the httpOnly cookie).
 *
 * The Node test environment's `Request` (undici) rejects relative URLs that
 * browsers resolve against the document — `fetchBaseQuery` constructs a
 * `Request` before calling fetch, so a thin wrapper makes relative URLs work.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userApi } from '../user.api';
import { store } from '../../redux/store';

// --- relative-URL friendly Request for the Node test environment ----------
const NativeRequest = globalThis.Request;
class RelativeRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, 'http://localhost').toString()
        : input,
      init,
    );
  }
}

interface CallInfo {
  url: string;
  method: string;
  body?: unknown;
  header: (name: string) => string | null;
  credentials?: RequestCredentials;
}

/** Normalize a fetch call (Request instance or string) into assertable parts. */
async function callInfo(call: unknown[]): Promise<CallInfo> {
  const input = call[0] as Request | string;
  const init = (call[1] ?? {}) as RequestInit;
  const req =
    typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
  const url = new URL(req.url);
  let body: unknown;
  if (init.body !== undefined) {
    body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
  } else if (req.body) {
    body = await req.clone().json().catch(() => req.clone().text());
  }
  const headers = req.headers;
  return {
    url: url.pathname + url.search,
    method: req.method,
    body,
    header: (name: string) => headers.get(name),
    credentials: init.credentials,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('Request', RelativeRequest);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  // Singleton store: drop cached queries from previous tests.
  store.dispatch(userApi.util.resetApiState());
});

/** Dispatch an endpoint outside React and await settlement. */
async function run(endpoint: string, arg: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initiate = (userApi.endpoints as any)[endpoint].initiate;
  await store.dispatch(initiate(arg, { subscribe: false }));
}

async function lastCall(): Promise<CallInfo> {
  const call = fetchMock.mock.calls.at(-1);
  expect(call, 'fetch must have been called').toBeDefined();
  return callInfo(call as unknown[]);
}

describe('user.api base configuration', () => {
  it('targets the same-origin /api base and sends x-requested-with on every request', async () => {
    await run('getSession', undefined);
    const info = await lastCall();
    expect(info.url).toBe('/api/auth/session');
    expect(info.header('x-requested-with')).toBe('fetch');
  });

  it('never leaks a session_id into URLs or bodies', async () => {
    await run('getUserLists', { accountId: 5, page: 2 });
    const info = await lastCall();
    expect(`${info.url} ${JSON.stringify(info.body ?? '')}`).not.toContain('session_id');
  });
});

describe('lists endpoints', () => {
  it('getUserLists calls GET /api/lists?accountId=&page=', async () => {
    await run('getUserLists', { accountId: 5, page: 2 });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists?accountId=5&page=2');
    expect(info.method).toBe('GET');
  });

  it('getListDetails calls GET /api/lists/:id?page=', async () => {
    await run('getListDetails', { id: 42, page: 3 });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists/42?page=3');
  });

  it('createList POSTs {name, description} to /api/lists', async () => {
    await run('createList', { name: 'Favoriler', description: 'tr' });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists');
    expect(info.method).toBe('POST');
    expect(info.body).toEqual({ name: 'Favoriler', description: 'tr' });
  });

  it('updateList POSTs {name, description} to /api/lists/:id/update', async () => {
    await run('updateList', { listId: 7, name: 'Yeni', description: 'Açıklama' });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists/7/update');
    expect(info.method).toBe('POST');
    expect(info.body).toEqual({ name: 'Yeni', description: 'Açıklama' });
  });

  it('deleteList issues DELETE /api/lists/:id?confirm=true', async () => {
    await run('deleteList', 42);
    const info = await lastCall();
    expect(info.url).toBe('/api/lists/42?confirm=true');
    expect(info.method).toBe('DELETE');
  });

  it('addListItem POSTs {mediaId} to /api/lists/:id/items', async () => {
    await run('addListItem', { listId: 9, mediaId: 550 });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists/9/items');
    expect(info.method).toBe('POST');
    expect(info.body).toEqual({ mediaId: 550 });
  });

  it('removeListItem issues DELETE /api/lists/:id/items with a {mediaId} body', async () => {
    await run('removeListItem', { listId: 9, mediaId: 550 });
    const info = await lastCall();
    expect(info.url).toBe('/api/lists/9/items');
    expect(info.method).toBe('DELETE');
    expect(info.body).toEqual({ mediaId: 550 });
  });
});

describe('account endpoints', () => {
  it('addFavorite POSTs {mediaType, mediaId, favorite} to /api/account/favorite', async () => {
    await run('addFavorite', { mediaType: 'movie', mediaId: 550, favorite: true });
    const info = await lastCall();
    expect(info.url).toBe('/api/account/favorite');
    expect(info.method).toBe('POST');
    expect(info.body).toEqual({ mediaType: 'movie', mediaId: 550, favorite: true });
  });

  it('setWatchlist POSTs {mediaType, mediaId, watchlist} to /api/account/watchlist', async () => {
    await run('setWatchlist', { mediaType: 'tv', mediaId: 1399, watchlist: false });
    const info = await lastCall();
    expect(info.url).toBe('/api/account/watchlist');
    expect(info.body).toEqual({ mediaType: 'tv', mediaId: 1399, watchlist: false });
  });

  it('rateMedia POSTs {mediaType, mediaId, value} to /api/account/rating', async () => {
    await run('rateMedia', { mediaType: 'movie', mediaId: 550, value: 8.5 });
    const info = await lastCall();
    expect(info.url).toBe('/api/account/rating');
    expect(info.body).toEqual({ mediaType: 'movie', mediaId: 550, value: 8.5 });
  });

  it('deleteRating issues DELETE /api/account/rating with a JSON body', async () => {
    await run('deleteRating', { mediaType: 'movie', mediaId: 550 });
    const info = await lastCall();
    expect(info.url).toBe('/api/account/rating');
    expect(info.method).toBe('DELETE');
    expect(info.body).toEqual({ mediaType: 'movie', mediaId: 550 });
  });

  it.each([
    ['getFavorites', { mediaType: 'movie' as const }, '/api/account/favorites?mediaType=movie&page=1'],
    ['getWatchlist', { mediaType: 'tv' as const, page: 2 }, '/api/account/watchlist?mediaType=tv&page=2'],
    ['getRated', { mediaType: 'movie' as const }, '/api/account/rated?mediaType=movie&page=1'],
  ])('%s calls GET %s', async (endpoint, arg, expectedUrl) => {
    await run(endpoint, arg);
    const info = await lastCall();
    expect(info.url).toBe(expectedUrl);
    expect(info.method).toBe('GET');
  });
});
