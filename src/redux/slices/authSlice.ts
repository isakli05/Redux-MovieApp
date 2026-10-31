/**
 * Auth Slice — BFF-backed session state (decision D1; fixes defect M).
 *
 * The v3 session credential lives ONLY in the httpOnly `tmdb_session` cookie;
 * it never enters Redux, localStorage, or any JS-reachable storage. Auth truth
 * comes exclusively from the server-validated `GET /api/auth/session` result
 * dispatched via `setUser` (see useAuth boot). The legacy
 * `loadUserFromStorage` action — which trusted `localStorage['tmdb_user']`
 * without validation — is removed.
 *
 * `hydrateProfile` may prefill DISPLAY-ONLY data (username/name/avatar) from
 * the non-sensitive `tmdb_profile` cookie so the navbar renders instantly;
 * it never sets `isAuthenticated`.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Display-only user shape (no session credential — that stays in the cookie). */
export interface AuthUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True once the boot-time /api/auth/session check has settled. */
  bootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  bootstrapped: false,
};

/** Shape encoded (base64url JSON) inside the tmdb_profile cookie. */
interface ProfileCookiePayload {
  username?: unknown;
  name?: unknown;
  avatar?: unknown;
  account_id?: unknown;
}

/**
 * Decode the display-only `tmdb_profile` cookie into an AuthUser, or null on
 * any malformed input. Exported for unit tests.
 */
export function decodeProfileCookie(cookieValue: string | undefined | null): AuthUser | null {
  if (!cookieValue) return null;
  try {
    const normalized = cookieValue.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    // atob yields latin1 code points; re-decode as UTF-8 for Turkish names.
    const bytes = Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as ProfileCookiePayload;
    if (
      typeof parsed.username !== 'string' ||
      typeof parsed.account_id !== 'number' ||
      parsed.username.length === 0
    ) {
      return null;
    }
    return {
      id: parsed.account_id,
      username: parsed.username,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      avatar: typeof parsed.avatar === 'string' ? parsed.avatar : null,
    };
  } catch {
    return null;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    /**
     * Set the auth user from the server-validated session result
     * (`/api/auth/session`). `null` means "confirmed unauthenticated" and
     * also marks the boot as finished.
     */
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      state.bootstrapped = true;
      state.isLoading = false;
    },
    /** Mark the boot finished without changing the user (error path). */
    bootFailed: (state) => {
      state.bootstrapped = true;
      state.isLoading = false;
    },
    /**
     * Prefill display-only profile data from the tmdb_profile cookie.
     * Never authenticates (fix M: profile data is not trust material).
     */
    hydrateProfile: (state, action: PayloadAction<AuthUser | null>) => {
      if (state.user === null && action.payload !== null) {
        state.user = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setUser, bootFailed, hydrateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
