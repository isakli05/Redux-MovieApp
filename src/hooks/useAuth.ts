/**
 * useAuth — BFF-backed client auth hook (decision D1).
 *
 * Public API (UNCHANGED — Navbar and the Lists pages depend on it):
 *   { user, isLoading, isAuthenticated, login, logout }
 *
 * Flow:
 * - Boot (fix M): `GET /api/auth/session` is called once per page load; the
 *   httpOnly cookie session is validated SERVER-side before the client
 *   believes it. A 404/failed request (plain `vite dev` without functions)
 *   degrades to the unauthenticated state instead of crashing.
 * - login: `POST /api/auth/request-token` → redirect to TMDB with
 *   `redirect_to={origin}/api/auth/callback` — the callback is a SERVER
 *   route now; the browser never sees the session id.
 * - logout (fix N): `POST /api/auth/logout` (server deletes the TMDB session
 *   and clears cookies) → dispatch logout locally.
 *
 * No session credential is stored in JS-reachable storage; the legacy
 * `tmdb_user` localStorage entry (XSS-readable session) is proactively
 * removed once on boot.
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  bootFailed,
  decodeProfileCookie,
  hydrateProfile,
  setLoading,
  logout as logoutAction,
  setUser,
} from '../redux/slices/authSlice';
import type { UserAccount } from '../api/user.api';

/** Session boot is shared across every useAuth() consumer (Navbar, pages…). */
let bootPromise: Promise<UserAccount | null> | null = null;

/** Test-only: drop the cached boot promise between test cases. */
export function resetAuthBootForTests(): void {
  bootPromise = null;
}

function readProfileCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = /(?:^|;\s*)tmdb_profile=([^;]+)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

/** TMDB approve URL for a request token; the redirect lands on the SERVER callback. */
export function tmdbAuthUrl(requestToken: string, origin: string): string {
  const redirectTo = `${origin}/api/auth/callback`;
  return (
    `https://www.themoviedb.org/authenticate/${encodeURIComponent(requestToken)}` +
    `?redirect_to=${encodeURIComponent(redirectTo)}`
  );
}

async function fetchSession(): Promise<UserAccount | null> {
  try {
    const res = await fetch('/api/auth/session', {
      headers: { 'x-requested-with': 'fetch' },
    });
    // Plain `vite dev` (no functions) returns 404 here — degrade silently.
    if (!res.ok) return null;
    const data = (await res.json()) as { authenticated?: boolean; account?: UserAccount };
    return data.authenticated && data.account ? data.account : null;
  } catch {
    return null;
  }
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading, isAuthenticated, bootstrapped } = useAppSelector((state) => state.auth);

  // Boot: hydrate display-only profile from the cookie, then validate the
  // session server-side exactly once.
  useEffect(() => {
    // Legacy cleanup: the old flow stored the session_id in localStorage.
    try {
      localStorage.removeItem('tmdb_user');
    } catch {
      /* storage may be unavailable — non-fatal */
    }

    dispatch(hydrateProfile(decodeProfileCookie(readProfileCookie())));

    if (!bootPromise) {
      bootPromise = fetchSession();
    }
    let cancelled = false;
    bootPromise
      .then((account) => {
        if (!cancelled) dispatch(setUser(account));
      })
      .catch(() => {
        if (!cancelled) dispatch(bootFailed());
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const login = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const res = await fetch('/api/auth/request-token', {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch' },
      });
      if (!res.ok) throw new Error('request-token failed');
      const data = (await res.json()) as { request_token?: string };
      if (!data.request_token) throw new Error('missing request token');

      window.location.href = tmdbAuthUrl(data.request_token, window.location.origin);
    } catch {
      // Leave the UI in the unauthenticated state; the login can be retried.
      dispatch(bootFailed());
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch' },
      });
    } catch {
      // Server unreachable: still clear local state. The cookie is cleared
      // server-side on any successful run; local UI must not linger.
    }
    dispatch(logoutAction());
  }, [dispatch]);

  return {
    user,
    isLoading,
    isAuthenticated,
    bootstrapped,
    login,
    logout,
  };
};
