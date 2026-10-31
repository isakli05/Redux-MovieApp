/**
 * The interaction log — single source of truth for user preference signals
 * across Seans, Cinema DNA, Group Choice, Daily Mystery and TV Tracker
 * (docs/interactive-experiences/SHARED_CONTRACTS.md §B).
 *
 * Events live in localStorage under a scope key: anonymous browsers share
 * `lmdb:interactions`, a signed-in TMDB account uses `lmdb:interactions@acct:<id>`.
 */
import { useEffect, useState } from 'react';
import type { MediaRef } from './mediaRef';

export type InteractionKind =
  | 'like'
  | 'dislike'
  | 'seen'
  | 'rating' // value: 1–10
  | 'comparison_win' // target preferred over `vs`
  | 'comparison_lose'
  | 'seans_reject'
  | 'episode_watched' // season + episode on a tv target
  | 'follow_show';

export type InteractionSource = 'seans' | 'dna' | 'tracker' | 'group' | 'mystery' | 'manual';

export interface Interaction {
  id: string;
  kind: InteractionKind;
  target: MediaRef;
  vs?: MediaRef;
  value?: number;
  season?: number;
  episode?: number;
  at: number; // epoch ms
  source: InteractionSource;
}

export type InteractionInput = Omit<Interaction, 'id' | 'at'> & Partial<Pick<Interaction, 'id' | 'at'>>;

const ANON_KEY = 'lmdb:interactions';
const CAP = 5000;

export function deviceId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem('lmdb:deviceId');
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('lmdb:deviceId', id);
    }
  } catch {
    id = id || 'ephemeral';
  }
  return id;
}

export function storeKey(accountId?: number | null): string {
  return accountId ? `${ANON_KEY}@acct:${accountId}` : ANON_KEY;
}

// --- storage primitives (defensive: storage may be unavailable/blocked) ---

function readEvents(key: string): Interaction[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Interaction[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(key: string, events: Interaction[]): void {
  try {
    if (events.length > CAP) events = events.slice(events.length - CAP);
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // Quota error: drop the oldest half and retry once.
    try {
      localStorage.setItem(key, JSON.stringify(events.slice(Math.floor(events.length / 2))));
    } catch {
      /* storage unusable — log stays in-memory for this session */
    }
  }
  listeners.forEach((fn) => fn());
}

/** Same logical event (kind + target + vs + season/episode) → upsert, not duplicate. */
function sameLogicalEvent(a: Interaction, b: InteractionInput): boolean {
  return (
    a.kind === b.kind &&
    a.target.kind === b.target.kind &&
    a.target.id === b.target.id &&
    (a.vs?.kind ?? undefined) === (b.vs?.kind ?? undefined) &&
    (a.vs?.id ?? undefined) === (b.vs?.id ?? undefined) &&
    a.season === b.season &&
    a.episode === b.episode
  );
}

// --- public API ---

export function listInteractions(accountId?: number | null): Interaction[] {
  return readEvents(storeKey(accountId));
}

/** Append (or update) one event. Returns the stored event. */
export function logInteraction(input: InteractionInput, accountId?: number | null): Interaction {
  const key = storeKey(accountId);
  const events = readEvents(key);
  const event: Interaction = {
    ...input,
    id: input.id ?? `${input.source}-${input.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: input.at ?? Date.now(),
  };
  const existing = events.findIndex((e) => sameLogicalEvent(e, input));
  if (existing >= 0) events[existing] = event;
  else events.push(event);
  writeEvents(key, events);
  return event;
}

export function removeInteraction(id: string, accountId?: number | null): void {
  const key = storeKey(accountId);
  writeEvents(key, readEvents(key).filter((e) => e.id !== id));
}

export function clearInteractions(accountId?: number | null): void {
  try {
    localStorage.removeItem(storeKey(accountId));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

/** Anonymous → account migration (SHARED_CONTRACTS §A): additive union, newer wins. */
export function mergeLocalIntoAccount(accountId: number): number {
  const local = readEvents(ANON_KEY);
  if (!local.length) return 0;
  const acctKey = storeKey(accountId);
  const acct = readEvents(acctKey);
  const merged = [...acct];
  let added = 0;
  for (const e of local) {
    const i = merged.findIndex((m) => sameLogicalEvent(m, e));
    if (i < 0) {
      merged.push(e);
      added++;
    } else if (e.at > merged[i].at) {
      merged[i] = e;
    }
  }
  writeEvents(acctKey, merged);
  return added;
}

// --- reactive binding ---

const listeners = new Set<() => void>();
const STORAGE_EVENT = 'lmdb-interactions-changed';

function emit(): void {
  listeners.forEach((fn) => fn());
  try {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    /* non-DOM context */
  }
}
// writeEvents notifies local listeners directly; also sync across tabs:
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key.startsWith(ANON_KEY)) emit();
  });
}

export function useInteractions(accountId?: number | null): Interaction[] {
  const [events, setEvents] = useState<Interaction[]>(() => listInteractions(accountId));
  useEffect(() => {
    const update = () => setEvents(listInteractions(accountId));
    update();
    listeners.add(update);
    const onStorage = () => update();
    window.addEventListener(STORAGE_EVENT, onStorage);
    return () => {
      listeners.delete(update);
      window.removeEventListener(STORAGE_EVENT, onStorage);
    };
  }, [accountId]);
  return events;
}
