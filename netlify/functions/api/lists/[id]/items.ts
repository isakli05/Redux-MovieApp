/**
 * List item add / remove  (fixes defect J at the API surface).
 *
 * Route        : POST   /api/lists/:id/items  body {mediaId}
 *                DELETE /api/lists/:id/items  body {mediaId}
 * TMDB calls   : POST /3/list/{id}/add_item    (form: media_id)
 *                POST /3/list/{id}/remove_item (form: media_id — v3 remove is a POST)
 * Cookie effects: none
 *
 * v3 lists are movie-only (decision D1): mediaId is a TMDB movie id. TV items
 * are a documented product limitation of the v3 list API.
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  positiveInt,
  readJsonBody,
  requireSession,
  tmdb,
  type FunctionContext,
  type FunctionHandler,
} from '../../../_shared/tmdb';

function extractListId(req: Request, context: FunctionContext): number | null {
  const fromContext = positiveInt(context.params?.id);
  if (fromContext) return fromContext;
  const match = /\/lists\/(\d+)\/items/.exec(new URL(req.url).pathname);
  return match ? positiveInt(match[1]) : null;
}

export default (async (req: Request, context: FunctionContext): Promise<Response> => {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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
  const mediaId = body ? positiveInt(body.mediaId) : null;
  if (!mediaId) {
    return apiError(400, 'invalid_argument', 'mediaId gereklidir (pozitif sayı).');
  }

  const upstreamPath = req.method === 'POST' ? 'add_item' : 'remove_item';
  const result = await tmdb(`/list/${listId}/${upstreamPath}`, {
    method: 'POST',
    sessionId: session.sessionId,
    formBody: { media_id: mediaId },
  });

  if (!result.ok) {
    // Sanitized: keep only the numeric TMDB status_code (8 = duplicate add,
    // 11/13/34 = not found/not owner) — never the upstream message.
    return apiError(502, 'upstream_unavailable', 'İşlem tamamlanamadı.', result.statusCode);
  }
  return json(200, {
    success: true,
    status_code: typeof result.data.status_code === 'number' ? result.data.status_code : undefined,
  });
}) satisfies FunctionHandler;
