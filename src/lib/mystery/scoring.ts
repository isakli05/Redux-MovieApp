/**
 * Scoring for the daily mystery — fewer attempts (⇒ fewer clues revealed)
 * earn more points; a loss always earns 0. Pure client-side arithmetic: there
 * is no leaderboard, points feed only the local streak/result card.
 */

export const MAX_ATTEMPTS = 6;

const POINTS_BY_ATTEMPT: readonly number[] = [100, 80, 60, 45, 30, 15];

/** Points for a win on `attemptsUsed` (1–6); anything out of range clamps. */
export function pointsForWin(attemptsUsed: number): number {
  const i = Math.min(Math.max(Math.trunc(attemptsUsed), 1), MAX_ATTEMPTS);
  return POINTS_BY_ATTEMPT[i - 1];
}

/**
 * How many ladder clues are visible: clue 1 is free, every wrong guess opens
 * the next one, capped by the ladder length.
 */
export function revealedClueCount(wrongGuesses: number, clueCount: number): number {
  return Math.min(1 + Math.max(wrongGuesses, 0), Math.max(clueCount, 1));
}
