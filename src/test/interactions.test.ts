import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearInteractions,
  listInteractions,
  logInteraction,
  mergeLocalIntoAccount,
  removeInteraction,
  storeKey,
} from '../lib/interactions';
import { mediaKey, parseMediaKey } from '../lib/mediaRef';

const movie = (id: number, title = 'Fight Club') => ({ kind: 'movie' as const, id, title });
const tv = (id: number) => ({ kind: 'tv' as const, id });

beforeEach(() => {
  localStorage.clear();
});

describe('mediaRef', () => {
  it('derives and parses canonical keys without conflating kinds', () => {
    expect(mediaKey(movie(123))).toBe('movie:123');
    expect(mediaKey(tv(123))).toBe('tv:123');
    expect(parseMediaKey('person:287')).toEqual({ kind: 'person', id: 287 });
    expect(parseMediaKey('movie:abc')).toBeNull();
    expect(parseMediaKey('band:5')).toBeNull();
  });
});

describe('interaction log', () => {
  it('appends events and lists them', () => {
    logInteraction({ kind: 'like', target: movie(550), source: 'dna' });
    logInteraction({ kind: 'rating', target: movie(550), value: 9, source: 'manual' });
    expect(listInteractions()).toHaveLength(2);
  });

  it('upserts same logical event instead of duplicating', () => {
    logInteraction({ kind: 'rating', target: movie(550), value: 7, source: 'manual' });
    logInteraction({ kind: 'rating', target: movie(550), value: 9, source: 'manual' });
    const events = listInteractions();
    expect(events).toHaveLength(1);
    expect(events[0].value).toBe(9);
  });

  it('keeps distinct episodes and pairwise comparisons separate', () => {
    logInteraction({ kind: 'episode_watched', target: tv(1399), season: 1, episode: 1, source: 'tracker' });
    logInteraction({ kind: 'episode_watched', target: tv(1399), season: 1, episode: 2, source: 'tracker' });
    logInteraction({ kind: 'comparison_win', target: movie(550), vs: movie(13), source: 'dna' });
    expect(listInteractions()).toHaveLength(3);
  });

  it('removes single events (undo) and clears the store', () => {
    const e = logInteraction({ kind: 'like', target: movie(550), source: 'seans' });
    removeInteraction(e.id);
    expect(listInteractions()).toHaveLength(0);
    logInteraction({ kind: 'dislike', target: movie(13), source: 'seans' });
    clearInteractions();
    expect(listInteractions()).toHaveLength(0);
  });

  it('scopes anonymous and account stores separately and merges on migration', () => {
    logInteraction({ kind: 'like', target: movie(550), source: 'dna' }); // anonymous scope
    logInteraction({ kind: 'like', target: movie(13), source: 'dna' }, 42); // account scope
    expect(listInteractions()).toHaveLength(1);
    expect(listInteractions(42)).toHaveLength(1);
    expect(storeKey(42)).toBe('lmdb:interactions@acct:42');

    const added = mergeLocalIntoAccount(42);
    expect(added).toBe(1);
    const merged = listInteractions(42);
    expect(merged).toHaveLength(2);
    // Local scope is preserved (not silently deleted).
    expect(listInteractions()).toHaveLength(1);
  });
});
