/**
 * BFF client for the daily mystery (SHARED_CONTRACTS §D: same-origin
 * `/api/*` functions only; the browser never talks to TMDB directly here).
 */

import { deviceId } from '../interactions';
import type { GuessResponse, MysteryDayPayload } from './types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // CSRF pairing required by the BFF on mutations.
      'x-requested-with': 'fetch',
      // Best-effort per-participant rate-limit key (in-memory server side).
      'x-lmdb-participant': deviceId(),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const code = (data as { error?: { code?: string } } | null)?.error?.code ?? 'unknown';
    throw new Error(code);
  }
  return data as T;
}

/** Today's clue ladder (UTC day decided by the server). */
export async function fetchDailyMystery(): Promise<MysteryDayPayload> {
  const res = await fetch('/api/daily-mystery');
  if (!res.ok) throw new Error('daily_mystery_unavailable');
  return (await res.json()) as MysteryDayPayload;
}

/** Submit a guess; `final` marks the last allowed attempt (triggers the reveal). */
export async function submitGuess(input: {
  guess: string;
  attempt: number;
  final: boolean;
}): Promise<GuessResponse> {
  return postJson<GuessResponse>('/api/daily-mystery/guess', input);
}
