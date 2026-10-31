/**
 * POST /api/auth/request-token
 * Wraps `/3/authentication/token/new` with the server-side API key and sets
 * a short-lived httpOnly `tmdb_rt` cookie mirroring the token so the callback
 * (next step) can verify the token it receives was the one we issued.
 *
 * Route        : POST /api/auth/request-token
 * TMDB call    : GET  /3/authentication/token/new?api_key=…
 * Cookie effects: tmdb_rt = request_token (httpOnly, 1h)
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  requestTokenCookie,
  tmdb,
  type FunctionHandler,
} from './_shared/tmdb';

/** v2 in-source route (flat layout: packager discovers root-level functions) */
export const config = { path: '/api/auth/request-token' };


export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return apiError(405, 'method_not_allowed');
  }
  if (!isMutationAuthorized(req)) {
    return apiError(403, 'forbidden');
  }

  const result = await tmdb('/authentication/token/new');
  if (!result.ok || typeof result.data.request_token !== 'string') {
    return apiError(502, 'upstream_unavailable', 'TMDB ile iletişim kurulamadı.');
  }

  const expiresAt = typeof result.data.expires_at === 'string' ? result.data.expires_at : undefined;

  return json(
    200,
    {
      request_token: result.data.request_token,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    },
    {},
    [requestTokenCookie(result.data.request_token)],
  );
}) satisfies FunctionHandler;
