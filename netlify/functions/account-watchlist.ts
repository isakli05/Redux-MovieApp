/**
 * Watchlist add / remove + list.
 *
 * Route        : POST /api/account/watchlist  body {mediaType, mediaId, watchlist}
 *                GET  /api/account/watchlist?mediaType=movie|tv&page=
 * TMDB calls   : GET  /3/account?session_id=…            (resolve account id)
 *                POST /3/account/{id}/watchlist  {media_type, media_id, watchlist}
 *                GET  /3/account/{id}/watchlist/{movies|tv}?page=
 * Cookie effects: none
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  mediaTypeSegment,
  positiveInt,
  readJsonBody,
  requireSession,
  resolveAccountId,
  tmdb,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/account/watchlist' };


export default (async (req: Request): Promise<Response> => {
  const session = requireSession(req);
  if ('response' in session) return session.response;

  const url = new URL(req.url);

  if (req.method === 'GET') {
    const mediaType = mediaTypeSegment(url.searchParams.get('mediaType')) ?? 'movie';
    const page = positiveInt(url.searchParams.get('page')) ?? 1;
    const account = await resolveAccountId(session.sessionId);
    if ('response' in account) return account.response;
    const result = await tmdb(`/account/${account.accountId}/watchlist/${mediaType}s`, {
      sessionId: session.sessionId,
      query: { page, language: 'tr-TR' },
    });
    if (!result.ok || !Array.isArray(result.data.results)) {
      return apiError(502, 'upstream_unavailable', 'İzleme listesi yüklenemedi.');
    }
    return json(200, result.data);
  }

  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const body = await readJsonBody(req);
  const mediaType = body ? mediaTypeSegment(body.mediaType) : null;
  const mediaId = body ? positiveInt(body.mediaId) : null;
  if (!mediaType || !mediaId || typeof body?.watchlist !== 'boolean') {
    return apiError(400, 'invalid_argument', 'mediaType, mediaId ve watchlist (boolean) gereklidir.');
  }

  const account = await resolveAccountId(session.sessionId);
  if ('response' in account) return account.response;

  const result = await tmdb(`/account/${account.accountId}/watchlist`, {
    method: 'POST',
    sessionId: session.sessionId,
    jsonBody: { media_type: mediaType, media_id: mediaId, watchlist: body.watchlist },
  });
  if (!result.ok) {
    return apiError(502, 'upstream_unavailable', 'İzleme listesi güncellenemedi.', result.statusCode);
  }
  return json(200, { success: true });
}) satisfies FunctionHandler;
