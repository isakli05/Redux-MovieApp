/**
 * Wire types shared by the BFF functions and the client. The answer payload is
 * the ONLY place a title may travel, and it is returned solely after the
 * challenge completes (correct guess or final wrong guess) — SHARED_CONTRACTS §E.
 */

import type { MysteryKind } from './core';

export interface MysteryClue {
  id: string;
  label: string;
  text: string;
}

/** GET /api/daily-mystery — clue ladder only; no answer material. */
export interface MysteryDayPayload {
  date: string;
  mediaType: MysteryKind;
  attemptsAllowed: number;
  clues: MysteryClue[];
}

/** Reveal payload, sent only on win/loss completion. */
export interface MysteryAnswer {
  mediaType: MysteryKind;
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  /** e.g. "Yönetmen: Christopher Nolan" or "Yaratıcı: Vince Gilligan". */
  creditsLine: string;
  overview: string;
}

/** POST /api/daily-mystery/guess response. */
export interface GuessResponse {
  date: string;
  correct: boolean;
  answer?: MysteryAnswer;
}
