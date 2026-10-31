/**
 * authSlice tests — BFF-backed auth state (fixes defect M):
 * - No localStorage trust: the loadUserFromStorage action is REMOVED.
 * - setUser only reflects the SERVER-VALIDATED /api/auth/session result.
 * - hydrateProfile prefills display-only cookie data WITHOUT authenticating.
 */

import { describe, expect, it } from 'vitest';
import authReducer, {
  decodeProfileCookie,
  hydrateProfile,
  logout,
  setUser,
  type AuthUser,
} from '../authSlice';
import * as authSliceModule from '../authSlice';

const account: AuthUser = { id: 42, username: 'isakli', name: 'İsa', avatar: '/abc.jpg' };

describe('authSlice actions', () => {
  it('setUser(account) authenticates and marks the boot finished', () => {
    const state = authReducer(undefined, setUser(account));
    expect(state.user).toEqual(account);
    expect(state.isAuthenticated).toBe(true);
    expect(state.bootstrapped).toBe(true);
  });

  it('setUser(null) means "confirmed unauthenticated" (fix M — server verdict only)', () => {
    const state = authReducer(undefined, setUser(null));
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.bootstrapped).toBe(true);
  });

  it('logout clears the user and the authenticated flag', () => {
    const state = authReducer(undefined, setUser(account));
    const next = authReducer(state, logout());
    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
  });

  it('hydrateProfile prefills display data but NEVER authenticates (fix M)', () => {
    const state = authReducer(undefined, hydrateProfile(account));
    expect(state.user).toEqual(account);
    expect(state.isAuthenticated).toBe(false);
    expect(state.bootstrapped).toBe(false);
  });

  it('hydrateProfile never overwrites an existing user', () => {
    const state = authReducer(undefined, setUser(account));
    const next = authReducer(state, hydrateProfile({ id: 9, username: 'other', name: '', avatar: null }));
    expect(next.user?.username).toBe('isakli');
  });

  it('the localStorage-trusting loadUserFromStorage action no longer exists (fix M)', () => {
    expect('loadUserFromStorage' in authSliceModule).toBe(false);
  });
});

describe('decodeProfileCookie', () => {
  // Mirrors the BFF's UTF-8 → base64url encoding (Buffer.toString('base64url')).
  const encode = (payload: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  it('decodes a valid base64url profile payload', () => {
    const cookie = encode({ username: 'isakli', name: 'İsa', avatar: '/a.jpg', account_id: 42 });
    expect(decodeProfileCookie(cookie)).toEqual({
      id: 42,
      username: 'isakli',
      name: 'İsa',
      avatar: '/a.jpg',
    });
  });

  it('returns null for malformed base64, non-JSON, or missing fields', () => {
    expect(decodeProfileCookie('!!!not-base64!!!')).toBeNull();
    expect(decodeProfileCookie(encode({ hello: 'world' }))).toBeNull();
    expect(decodeProfileCookie(encode({ username: 'x' }))).toBeNull(); // account_id missing
    expect(decodeProfileCookie(undefined)).toBeNull();
    expect(decodeProfileCookie('')).toBeNull();
  });

  it('contains no session material — the profile cookie is display-only', () => {
    const cookie = encode({ username: 'isakli', name: '', avatar: null, account_id: 1 });
    expect(decodeProfileCookie(cookie)).not.toHaveProperty('session_id');
  });
});
