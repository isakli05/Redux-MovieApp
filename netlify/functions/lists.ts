/**
 * User lists collection.
 *
 * Route        : GET  /api/lists?accountId=&page=
 *                POST /api/lists   body {name, description?}
 * TMDB calls   : GET  /3/account/{accountId}/lists?session_id=&page=
 *                POST /3/list  {name, description, language}
 * Cookie effects: none
 *
 * v3 constraint (decision D1): lists are movie-only. Mixed movie/TV custom
 * lists are a documented product limitation of the v3 API.
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  positiveInt,
  nonEmptyString,
  readJsonBody,
  requireSession,
  tmdb,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/lists' };


const MAX_NAME = 200;
const MAX_DESCRIPTION = 1000;

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const accountId = positiveInt(url.searchParams.get('accountId'));
    const page = positiveInt(url.searchParams.get('page')) ?? 1;
    if (!accountId) {
      return apiError(400, 'invalid_argument', 'accountId gereklidir.');
    }
    const result = await tmdb(`/account/${accountId}/lists`, {
      sessionId: session.sessionId,
      query: { page },
    });
    if (!result.ok || !Array.isArray(result.data.results)) {
      return apiError(502, 'upstream_unavailable', 'Listeler yüklenemedi.');
    }
    return json(200, result.data);
  }

  // POST — create a list
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }
  const body = await readJsonBody(req);
  if (!body) {
    return apiError(400, 'invalid_body', 'Geçersiz istek gövdesi.');
  }
  const name = nonEmptyString(body.name, MAX_NAME);
  const description =
    body.description === undefined || body.description === null
      ? ''
      : nonEmptyString(body.description, MAX_DESCRIPTION);
  if (!name) {
    return apiError(400, 'invalid_argument', 'Liste adı gereklidir.');
  }
  if (description === null) {
    return apiError(400, 'invalid_argument', 'Açıklama çok uzun.');
  }

  const result = await tmdb('/list', {
    method: 'POST',
    sessionId: session.sessionId,
    jsonBody: {
      name,
      description,
      language: typeof body.language === 'string' ? body.language : 'tr-TR',
    },
  });
  if (!result.ok || typeof result.data.list_id !== 'number') {
    return apiError(502, 'upstream_unavailable', 'Liste oluşturulamadı.');
  }
  return json(201, { list_id: result.data.list_id, success: true });
}) satisfies FunctionHandler;
