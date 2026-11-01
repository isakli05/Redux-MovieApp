/**
 * Günlük Bilmece — server-side guess validation.
 *
 * Route        : POST /api/daily-mystery/guess  body {guess, attempt?, final?}
 * TMDB calls   : GET /3/{movie|tv}/{id}?language=tr-TR&append_to_response=…
 * Cookie effects: none
 * Validation    : guess ≤ 100 chars; per-participant daily rate limit.
 *
 * The answer set (title + original title + TMDB alternative titles) is built
 * and compared SERVER-side; the answer payload is returned only when the
 * challenge completes — a correct guess, or a wrong guess flagged `final`
 * (SHARED_CONTRACTS §E: answers never ship to the client before completion).
 */

import { answerSet, toAnswerPayload } from '../../src/lib/mystery/clues';
import { mysteryDateKey } from '../../src/lib/mystery/core';
import { titlesMatch } from '../../src/lib/mystery/normalize';
import {
  apiError,
  isMutationAuthorized,
  json,
  nonEmptyString,
  readJsonBody,
  type FunctionHandler,
} from './_shared/tmdb';
import { fetchDailySource } from './daily-mystery';

/** v2 in-source route (flat layout: packager discovers root-level functions). */
export const config = { path: '/api/daily-mystery/guess' };

/**
 * Best-effort per-participant daily cap: 6 attempts + replay/share slack.
 * In-memory per warm instance (multiple instances each enforce their share) —
 * a soft anti-hammering guard, not a hard guarantee; there is no prize pool.
 */
const DAILY_GUESS_LIMIT = 12;
const buckets = new Map<string, number>();

function rateLimited(participant: string, date: string): boolean {
  const key = `${date}|${participant}`;
  const count = (buckets.get(key) ?? 0) + 1;
  buckets.set(key, count);
  if (buckets.size > 1000) {
    // Prune stale days only; today's buckets survive.
    for (const k of buckets.keys()) if (!k.startsWith(date)) buckets.delete(k);
  }
  return count > DAILY_GUESS_LIMIT;
}

/** Spoofing-resistant-enough participant key: client id, else connection IP. */
function participantOf(req: Request): string {
  const header = req.headers.get('x-lmdb-participant') ?? '';
  if (/^[A-Za-z0-9_-]{1,64}$/.test(header)) return header;
  return req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for') ?? 'anon';
}

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const body = await readJsonBody(req);
  const guess = nonEmptyString(body?.guess, 100);
  if (!guess) {
    return apiError(400, 'invalid_argument', 'Geçerli bir tahmin gereklidir.');
  }
  const final = body?.final === true;

  const date = mysteryDateKey(new Date());
  if (rateLimited(participantOf(req), date)) {
    return apiError(429, 'rate_limited', 'Bugünlük tahmin sınırına ulaşıldı.');
  }

  const src = await fetchDailySource(date);
  if (!src) {
    return apiError(502, 'upstream_unavailable', 'Bilmece şu anda hazırlanamıyor.');
  }

  const answers = answerSet(src);
  const correct = titlesMatch(guess, answers);
  const includeAnswer = correct || final;

  return json(200, {
    date,
    correct,
    ...(includeAnswer ? { answer: toAnswerPayload(src) } : {}),
  });
}) satisfies FunctionHandler;
