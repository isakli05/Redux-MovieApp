/**
 * Single list detail / delete.
 *
 * Route        : GET    /api/lists/:id?page=          (public list data — no session)
 *                DELETE /api/lists/:id?confirm=true   (owner session required)
 * TMDB calls   : GET    /3/list/{id}?page=
 *                POST   /3/list/{id}/clear   (best-effort, then…)
 *                DELETE /3/list/{id}
 * Cookie effects: none
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  positiveInt,
  requireSession,
  tmdb,
  type FunctionContext,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/lists/:id' };


/** Prefer context.params (bracket routing); fall back to parsing req.url. */
function extractListId(req: Request, context: FunctionContext): number | null {
  const fromContext = positiveInt(context.params?.id);
  if (fromContext) return fromContext;
  const match = /\/lists\/(\d+)/.exec(new URL(req.url).pathname);
  return match ? positiveInt(match[1]) : null;
}

export default (async (req: Request, context: FunctionContext): Promise<Response> => {
  const listId = extractListId(req, context);
  if (!listId) {
    return apiError(400, 'invalid_argument', 'Geçersiz liste kimliği.');
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const page = positiveInt(url.searchParams.get('page')) ?? 1;
    const result = await tmdb(`/list/${listId}`, { query: { page, language: 'tr-TR' } });
    if (!result.ok || typeof result.data.id !== 'number') {
      return apiError(502, 'upstream_unavailable', 'Liste yüklenemedi.');
    }
    return json(200, result.data);
  }

  if (req.method !== 'DELETE') {
    return apiError(405, 'method_not_allowed');
  }

  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const url = new URL(req.url);
  if (url.searchParams.get('confirm') !== 'true') {
    return apiError(400, 'confirmation_required', 'Silme onayı gereklidir (?confirm=true).');
  }

  const session = requireSession(req);
  if ('response' in session) return session.response;

  // v3 flow: empty the list first (best-effort), then delete it.
  await tmdb(`/list/${listId}/clear`, {
    method: 'POST',
    sessionId: session.sessionId,
  });
  const result = await tmdb(`/list/${listId}`, {
    method: 'DELETE',
    sessionId: session.sessionId,
  });
  if (!result.ok) {
    return apiError(502, 'upstream_unavailable', 'Liste silinemedi.', result.statusCode);
  }
  return json(200, { success: true });
}) satisfies FunctionHandler;
