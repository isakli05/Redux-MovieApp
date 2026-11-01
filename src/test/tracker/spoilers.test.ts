/**
 * Spoiler açma tercihleri: dizi başına kalıcılık, kapsam izolasyonu ve
 * girişteki eklemeli göç (SHARED_CONTRACTS §A/§E).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  isRevealed,
  mergeLocalSpoilerPrefsIntoAccount,
  revealedShowIds,
  setRevealed,
} from '../../lib/tracker/spoilers';

beforeEach(() => {
  localStorage.clear();
});

describe('spoiler reveal preferences', () => {
  it('defaults to unrevealed and persists an explicit reveal per show', () => {
    expect(isRevealed(1399)).toBe(false);
    setRevealed(1399, true);
    expect(isRevealed(1399)).toBe(true);
    expect(isRevealed(46648)).toBe(false);
    expect(revealedShowIds()).toEqual(new Set([1399]));
    expect(JSON.parse(localStorage.getItem('lmdb:tracker:spoilers') ?? '[]')).toContain(1399);
  });

  it('re-hides on demand', () => {
    setRevealed(1399, true);
    setRevealed(1399, false);
    expect(isRevealed(1399)).toBe(false);
  });

  it('keeps anonymous and account scopes apart', () => {
    setRevealed(1399, true);
    setRevealed(46648, true, 42);
    expect(isRevealed(1399)).toBe(true);
    expect(isRevealed(1399, 42)).toBe(false);
    expect(isRevealed(46648, 42)).toBe(true);
  });

  it('merges local prefs into the account additively and keeps local', () => {
    setRevealed(1399, true);
    setRevealed(46648, true, 42);
    const added = mergeLocalSpoilerPrefsIntoAccount(42);
    expect(added).toBe(1);
    expect(revealedShowIds(42)).toEqual(new Set([1399, 46648]));
    // Kapsamlardan hiçbiri sessizce silinmez (§A).
    expect(revealedShowIds()).toEqual(new Set([1399]));
  });

  it('merge is a no-op when local is empty', () => {
    expect(mergeLocalSpoilerPrefsIntoAccount(7)).toBe(0);
  });
});
