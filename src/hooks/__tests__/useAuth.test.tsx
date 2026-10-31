/**
 * useAuth flow tests (BFF-backed; NO real network — global fetch is mocked):
 * - boot: /api/auth/session validated state lands in Redux (fix M)
 * - boot degrades to unauthenticated when /api is 404 (plain vite dev)
 * - login: POST /api/auth/request-token → TMDB redirect with the SERVER
 *   callback (/api/auth/callback) as redirect_to
 * - logout: POST /api/auth/logout then local state clear (fix N)
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../redux/store';
import { setUser } from '../../redux/slices/authSlice';
import { resetAuthBootForTests, tmdbAuthUrl, useAuth } from '../useAuth';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const fetchMock = vi.fn();

// jsdom cannot navigate; a mutable location stub captures redirect hrefs.
beforeEach(() => {
  resetAuthBootForTests();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { href: '', origin: 'http://localhost:3000' } as unknown as Location);
  store.dispatch(setUser(null));
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('boot (fix M)', () => {
  it('validates the session server-side and authenticates on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        authenticated: true,
        account: { id: 42, username: 'isakli', name: 'İsa', avatar: null },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.bootstrapped).toBe(true));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('isakli');

    const sessionCall = fetchMock.mock.calls.find(([url]) => url === '/api/auth/session');
    expect(sessionCall).toBeDefined();
    const init = sessionCall?.[1] as RequestInit;
    expect(new Headers(init.headers as HeadersInit).get('x-requested-with')).toBe('fetch');
  });

  it('degrades to unauthenticated when /api is 404 (plain vite dev, no functions)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Not Found' }, 404));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.bootstrapped).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('degrades to unauthenticated when the network request fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.bootstrapped).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('removes the legacy tmdb_user localStorage entry on boot', async () => {
    localStorage.setItem('tmdb_user', '{"session_id":"leaked"}');
    fetchMock.mockResolvedValue(jsonResponse({ authenticated: false }));

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(localStorage.getItem('tmdb_user')).toBeNull());
  });
});

describe('login', () => {
  it('requests a token from the BFF (the session exchange is server-side)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ request_token: 'tok-123' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login();
    });

    const tokenCall = fetchMock.mock.calls.find(([url]) => url === '/api/auth/request-token');
    expect(tokenCall).toBeDefined();
    const init = tokenCall?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers as HeadersInit).get('x-requested-with')).toBe('fetch');
    // The session exchange never touches the client: no other /api call is
    // made from the browser beyond the boot session check.
    const urls = (fetchMock.mock.calls as unknown as [string][]).map(([url]) => url);
    expect(urls).not.toContain('/api/auth/callback');
  });

  it('builds the TMDB redirect against the SERVER callback (/api/auth/callback)', () => {
    // jsdom cannot navigate (location is unforgeable), so the URL contract is
    // asserted against the exported pure builder used by login().
    const url = tmdbAuthUrl('tok 123', 'http://localhost:3000');
    expect(url).toContain(`https://www.themoviedb.org/authenticate/${encodeURIComponent('tok 123')}`);
    expect(url).toContain(
      `redirect_to=${encodeURIComponent('http://localhost:3000/api/auth/callback')}`,
    );
  });

  it('stays unauthenticated when the BFF rejects the token request', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { code: 'forbidden' } }, 403));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('logout (fix N)', () => {
  it('calls the BFF logout endpoint and clears local auth state', async () => {
    store.dispatch(setUser({ id: 42, username: 'isakli', name: 'İsa', avatar: null }));
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const logoutCall = calls.find(([url]) => url === '/api/auth/logout');
    expect(logoutCall).toBeDefined();
    expect(logoutCall?.[1].method).toBe('POST');
    expect(new Headers(logoutCall?.[1].headers as HeadersInit).get('x-requested-with')).toBe('fetch');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('still clears local state when the BFF is unreachable', async () => {
    store.dispatch(setUser({ id: 42, username: 'isakli', name: '', avatar: null }));
    fetchMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
