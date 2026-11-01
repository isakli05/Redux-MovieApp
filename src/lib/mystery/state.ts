/**
 * Local daily-mystery state (SHARED_CONTRACTS §E): streak, played days and the
 * in-progress session for the CURRENT puzzle day, under `lmdb:mystery:*`.
 * Anonymous and local only — no leaderboard, no server sync.
 *
 * The reveal payload is persisted only as part of a COMPLETED day record, so a
 * refresh after finishing still shows the answer card but nothing ever leaks a
 * future/unplayed day's title.
 */

import { shiftDateKey } from './core';
import type { MysteryAnswer } from './types';

const DAYS_KEY = 'lmdb:mystery:days';
const SESSION_KEY = 'lmdb:mystery:session';

export interface MysteryDayRecord {
  date: string;
  won: boolean;
  attempts: number;
  points: number;
  answer: MysteryAnswer;
}

export interface MysterySession {
  date: string;
  /** Wrong guesses so far (a correct guess ends the session). */
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  /** Present once the challenge completed (reveal payload). */
  answer?: MysteryAnswer;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — state stays in-memory for this session */
  }
}

/** The stored session when it belongs to `date`; null otherwise (new day). */
export function loadSession(date: string): MysterySession | null {
  const s = readJson<MysterySession | null>(SESSION_KEY, null);
  return s && s.date === date ? s : null;
}

export function saveSession(session: MysterySession): void {
  writeJson(SESSION_KEY, session);
}

export function loadDays(): Record<string, MysteryDayRecord> {
  return readJson<Record<string, MysteryDayRecord>>(DAYS_KEY, {});
}

/** Record a completed day (upsert — replay of a finished day does not double). */
export function recordDay(record: MysteryDayRecord): Record<string, MysteryDayRecord> {
  const days = loadDays();
  days[record.date] = record;
  writeJson(DAYS_KEY, days);
  return days;
}

/**
 * Consecutive WON days ending at `today` (if already won) or at yesterday
 * (today not yet played keeps the banked streak). A recorded LOSS today ends
 * the streak immediately — standard daily-game semantics.
 */
export function currentStreak(days: Record<string, MysteryDayRecord>, today: string): number {
  const todayRecord = days[today];
  if (todayRecord && !todayRecord.won) return 0;
  let cursor = todayRecord?.won ? today : shiftDateKey(today, -1);
  let streak = 0;
  for (let guard = 0; guard < 3660; guard++) {
    if (days[cursor]?.won) {
      streak++;
      cursor = shiftDateKey(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Shareable result text (Turkish). NEVER includes the answer or any clue —
 * only the date, attempt count and streak.
 */
export function buildShareText(input: {
  date: string;
  won: boolean;
  attempts: number;
  maxAttempts: number;
  streak: number;
}): string {
  const [y, m, d] = input.date.split('-');
  const dateLabel = `${d}.${m}.${y}`;
  const result = input.won
    ? `${input.attempts}/${input.maxAttempts} denemede bildim!`
    : `Bu günün bilmecesini çözemedim (${input.maxAttempts} deneme).`;
  const streak = input.streak > 0 ? ` Seri: ${input.streak} gün.` : '';
  return `Günlük Bilmece — ${dateLabel}\n${result}${streak}\nSen de dene: /bilmece`;
}
