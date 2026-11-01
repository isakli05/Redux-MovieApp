/**
 * Spoiler açma tercihleri — kapsam başına (`lmdb:tracker:*`, SHARED_CONTRACTS §E).
 * "Göster" bir arayüz tercihi, tad sinyali değil: etkileşim günlüğüne
 * asla yazılmaz. Geri alınabilir ve dizi başına kalıcıdır.
 */
import { useEffect, useState } from 'react';

const KEY = 'lmdb:tracker:spoilers';

function scopedKey(accountId?: number | null): string {
  return accountId ? `${KEY}@acct:${accountId}` : KEY;
}

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is number => Number.isInteger(v)) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: number[]): void {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
  } catch {
    /* kota dolu: tercih bu oturum için kaybolur, izleme verisi etkilenmez */
  }
  listeners.forEach((fn) => fn());
}

export function revealedShowIds(accountId?: number | null): Set<number> {
  return new Set(readIds(scopedKey(accountId)));
}

export function isRevealed(tvId: number, accountId?: number | null): boolean {
  return readIds(scopedKey(accountId)).includes(tvId);
}

export function setRevealed(tvId: number, revealed: boolean, accountId?: number | null): void {
  const key = scopedKey(accountId);
  const ids = new Set(readIds(key));
  if (revealed) ids.add(tvId);
  else ids.delete(tvId);
  writeIds(key, [...ids]);
}

/** Anonim → hesap göçü: birleşim (additive), lokal kapsam silinmez (§A). */
export function mergeLocalSpoilerPrefsIntoAccount(accountId: number): number {
  const local = readIds(KEY);
  if (!local.length) return 0;
  const acct = new Set(readIds(scopedKey(accountId)));
  let added = 0;
  for (const id of local) {
    if (!acct.has(id)) {
      acct.add(id);
      added++;
    }
  }
  writeIds(scopedKey(accountId), [...acct]);
  return added;
}

// --- reactive binding (interactions.ts deseni) ------------------------------

const listeners = new Set<() => void>();
const STORAGE_EVENT = 'lmdb-tracker-spoilers-changed';

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key.startsWith(KEY)) {
      listeners.forEach((fn) => fn());
      window.dispatchEvent(new Event(STORAGE_EVENT));
    }
  });
}

/** Dizi başına kalıcı "göster" durumu; bileşen tarafında tek kanıt. */
export function useSpoilerRevealed(
  tvId: number,
  accountId?: number | null,
): [boolean, (revealed: boolean) => void] {
  const [revealed, setRevealedState] = useState(() => isRevealed(tvId, accountId));
  useEffect(() => {
    const update = () => setRevealedState(isRevealed(tvId, accountId));
    update();
    listeners.add(update);
    const onStorage = () => update();
    window.addEventListener(STORAGE_EVENT, onStorage);
    return () => {
      listeners.delete(update);
      window.removeEventListener(STORAGE_EVENT, onStorage);
    };
  }, [tvId, accountId]);
  return [revealed, (r) => setRevealed(tvId, r, accountId)];
}
