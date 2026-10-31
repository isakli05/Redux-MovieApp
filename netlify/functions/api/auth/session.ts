/**
 * GET /api/auth/session  (fixes defect M: the client boots auth from here —
 * a cookie session is only trusted after server-side validation)
 *
 * Route        : GET /api/auth/session
 * TMDB calls   : GET /3/account?session_id=… (only when a session cookie exists)
 * Cookie effects: none (a stale/invalid session cookie is cleared best-effort)
 * Response     : {authenticated: true, account: {id, username, name, avatar}}
 *                or {authenticated: false} — always HTTP 200 unless misconfigured.
 */

import {
  COOKIE,
  clearingCookies,
  json,
  sessionFromCookie,
  tmdb,
  toAccountPayload,
  type FunctionHandler,
} from '../../_shared/tmdb';

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return json(405, { error: { code: 'method_not_allowed' } });
  }

  const sessionId = sessionFromCookie(req);
  if (!sessionId) {
    return json(200, { authenticated: false });
  }

  const result = await tmdb('/account', { sessionId });
  const payload = result.ok ? toAccountPayload(result.data) : null;

  if (!payload) {
    // 401-safe: invalid session is reported as unauthenticated (and the stale
    // cookie is cleared so the client does not retry with it forever).
    return json(200, { authenticated: false }, {}, clearingCookies(COOKIE.session, COOKIE.profile));
  }

  return json(200, { authenticated: true, account: payload });
}) satisfies FunctionHandler;
