/**
 * POST /api/auth/logout  (fixes defect N: logout used to be local-only)
 *
 * Route        : POST /api/auth/logout
 * TMDB calls   : DELETE /3/authentication/session (best-effort)
 * Cookie effects: tmdb_session, tmdb_profile, tmdb_rt all cleared
 * Response     : {success: true}
 */

import {
  COOKIE,
  apiError,
  clearingCookies,
  isMutationAuthorized,
  json,
  sessionFromCookie,
  tmdb,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/auth/logout' };


export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const sessionId = sessionFromCookie(req);
  if (sessionId) {
    // Best-effort: even if TMDB is unreachable, the cookies are cleared below.
    await tmdb('/authentication/session', { method: 'DELETE', sessionId });
  }

  return json(
    200,
    { success: true },
    {},
    clearingCookies(COOKIE.session, COOKIE.profile, COOKIE.requestToken),
  );
}) satisfies FunctionHandler;
