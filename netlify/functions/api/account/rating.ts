/**
 * Rate / un-rate a movie or TV show.
 *
 * Route        : POST   /api/account/rating  body {mediaType, mediaId, value}
 *                DELETE /api/account/rating  body {mediaType, mediaId}
 * TMDB calls   : POST   /3/{movie|tv}/{mediaId}/rating?session_id=…  {value}
 *                DELETE /3/{movie|tv}/{mediaId}/rating?session_id=…
 * Cookie effects: none
 * Validation    : value must be a multiple of 0.5 in [0.5, 10].
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  mediaTypeSegment,
  positiveInt,
  readJsonBody,
  requireSession,
  tmdb,
  type FunctionHandler,
} from '../../_shared/tmdb';

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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
  if (!mediaType || !mediaId) {
    return apiError(400, 'invalid_argument', 'mediaType ve mediaId gereklidir.');
  }

  if (req.method === 'POST') {
    const value = body?.value;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.5 || value > 10 || (value * 2) % 1 !== 0) {
      return apiError(400, 'invalid_argument', 'Puan 0.5 ile 10 arasında ve 0.5’in katı olmalıdır.');
    }
    const result = await tmdb(`/${mediaType}/${mediaId}/rating`, {
      method: 'POST',
      sessionId: session.sessionId,
      jsonBody: { value },
    });
    if (!result.ok) {
      return apiError(502, 'upstream_unavailable', 'Puan kaydedilemedi.', result.statusCode);
    }
    return json(200, { success: true });
  }

  const result = await tmdb(`/${mediaType}/${mediaId}/rating`, {
    method: 'DELETE',
    sessionId: session.sessionId,
  });
  if (!result.ok) {
    return apiError(502, 'upstream_unavailable', 'Puan silinemedi.', result.statusCode);
  }
  return json(200, { success: true });
}) satisfies FunctionHandler;
