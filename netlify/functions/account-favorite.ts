/**
 * Mark / unmark a favorite (movie or TV).
 *
 * Route        : POST /api/account/favorite  body {mediaType, mediaId, favorite}
 * TMDB calls   : GET  /3/account?session_id=…            (resolve account id)
 *                POST /3/account/{id}/favorite  {media_type, media_id, favorite}
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
export const config = { path: '/api/account/favorite' };


export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  const body = await readJsonBody(req);
  const mediaType = body ? mediaTypeSegment(body.mediaType) : null;
  const mediaId = body ? positiveInt(body.mediaId) : null;
  const favorite = body ? body.favorite === true : false;
  if (!mediaType || !mediaId || typeof body?.favorite !== 'boolean') {
    return apiError(400, 'invalid_argument', 'mediaType, mediaId ve favorite (boolean) gereklidir.');
  }

  const account = await resolveAccountId(session.sessionId);
  if ('response' in account) return account.response;

  const result = await tmdb(`/account/${account.accountId}/favorite`, {
    method: 'POST',
    sessionId: session.sessionId,
    jsonBody: { media_type: mediaType, media_id: mediaId, favorite },
  });
  if (!result.ok) {
    return apiError(502, 'upstream_unavailable', 'Favori güncellenemedi.', result.statusCode);
  }
  return json(200, { success: true });
}) satisfies FunctionHandler;
