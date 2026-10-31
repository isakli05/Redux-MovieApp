/**
 * Update list metadata (name / description).
 *
 * Route        : POST /api/lists/:id/update  body {name, description?}
 * TMDB calls   : POST /3/list/{id}/update  {name, description}
 * Cookie effects: none
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  nonEmptyString,
  positiveInt,
  readJsonBody,
  requireSession,
  tmdb,
  type FunctionContext,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/lists/:id/update' };


function extractListId(req: Request, context: FunctionContext): number | null {
  const fromContext = positiveInt(context.params?.id);
  if (fromContext) return fromContext;
  const match = /\/lists\/(\d+)\/update/.exec(new URL(req.url).pathname);
  return match ? positiveInt(match[1]) : null;
}

export default (async (req: Request, context: FunctionContext): Promise<Response> => {
  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const listId = extractListId(req, context);
  if (!listId) {
    return apiError(400, 'invalid_argument', 'Geçersiz liste kimliği.');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  const body = await readJsonBody(req);
  if (!body) {
    return apiError(400, 'invalid_body', 'Geçersiz istek gövdesi.');
  }
  const name = nonEmptyString(body.name, 200);
  if (!name) {
    return apiError(400, 'invalid_argument', 'Liste adı gereklidir.');
  }
  const description =
    body.description === undefined || body.description === null
      ? ''
      : nonEmptyString(body.description, 1000);
  if (description === null) {
    return apiError(400, 'invalid_argument', 'Açıklama çok uzun.');
  }

  const result = await tmdb(`/list/${listId}/update`, {
    method: 'POST',
    sessionId: session.sessionId,
    jsonBody: { name, description },
  });
  if (!result.ok) {
    return apiError(502, 'upstream_unavailable', 'Liste güncellenemedi.', result.statusCode);
  }
  return json(200, { success: true });
}) satisfies FunctionHandler;
