/**
 * List the account's rated movies / TV shows.
 *
 * Route        : GET /api/account/rated?mediaType=movie|tv&page=(&sort_by=)
 * TMDB calls   : GET /3/account?session_id=…   (resolve account id)
 *                GET /3/account/{id}/rated/{movies|tv}?page=&sort_by=
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

const ALLOWED_SORTS = new Set([
  'created_at.asc',
  'created_at.desc',
]);

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return apiError(405, 'method_not_allowed');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  const url = new URL(req.url);
  const mediaType = mediaTypeSegment(url.searchParams.get('mediaType')) ?? 'movie';
  const page = positiveInt(url.searchParams.get('page')) ?? 1;
  const sortBy = url.searchParams.get('sort_by');

  const account = await resolveAccountId(session.sessionId);
  if ('response' in account) return account.response;

  const result = await tmdb(`/account/${account.accountId}/rated/${mediaType}s`, {
    sessionId: session.sessionId,
    query: {
      page,
      language: 'tr-TR',
      sort_by: sortBy && ALLOWED_SORTS.has(sortBy) ? sortBy : undefined,
    },
  });
  if (!result.ok || !Array.isArray(result.data.results)) {
    return apiError(502, 'upstream_unavailable', 'Puanlanan içerikler yüklenemedi.');
  }
  return json(200, result.data);
}) satisfies FunctionHandler;
