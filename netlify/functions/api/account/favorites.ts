/**
 * List the account's favorite movies / TV shows.
 *
 * Route        : GET /api/account/favorites?mediaType=movie|tv&page=
 * TMDB calls   : GET /3/account?session_id=…   (resolve account id)
 *                GET /3/account/{id}/favorite/{movies|tv}?page=
 * Cookie effects: none
 */

import {
  apiError,
  json,
  mediaTypeSegment,
  positiveInt,
  requireSession,
  resolveAccountId,
  tmdb,
  type FunctionHandler,
} from '../../_shared/tmdb';

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return apiError(405, 'method_not_allowed');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  const url = new URL(req.url);
  const mediaType = mediaTypeSegment(url.searchParams.get('mediaType')) ?? 'movie';
  const page = positiveInt(url.searchParams.get('page')) ?? 1;

  const account = await resolveAccountId(session.sessionId);
  if ('response' in account) return account.response;

  const result = await tmdb(`/account/${account.accountId}/favorite/${mediaType}s`, {
    sessionId: session.sessionId,
    query: { page, language: 'tr-TR' },
  });
  if (!result.ok || !Array.isArray(result.data.results)) {
    return apiError(502, 'upstream_unavailable', 'Favoriler yüklenemedi.');
  }
  return json(200, result.data);
}) satisfies FunctionHandler;
