/**
 * GET /api/auth/callback?request_token=&approved=
 * TMDB redirects the user here after approve/deny. Server-side exchange:
 *
 * Route        : GET /api/auth/callback
 * TMDB calls   : POST /3/authentication/session/new {request_token}
 *                GET  /3/account?session_id=…
 * Cookie effects: tmdb_session = session_id (httpOnly, 1y)
 *                 tmdb_profile = base64 display profile (NOT httpOnly, 1y)
 *                 tmdb_rt cleared
 * Failure       : 302 → /lists?auth=error (tmdb_rt cleared)
 */

import {
  COOKIE,
  clearingCookies,
  profileCookie,
  redirect,
  sessionCookie,
  tmdb,
  toAccountPayload,
  type FunctionHandler,
} from '../../_shared/tmdb';

const ERROR_COOKIES = clearingCookies(COOKIE.requestToken);

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return redirect('/lists?auth=error');
  }

  const url = new URL(req.url);
  const requestToken = url.searchParams.get('request_token');
  const approved = url.searchParams.get('approved');
  const rtCookieHeader = req.headers.get('cookie') ?? '';
  const rtMatch = new RegExp(`(?:^|;\\s*)${COOKIE.requestToken}=([^;]+)`).exec(rtCookieHeader);
  const rtCookie = rtMatch ? decodeURIComponent(rtMatch[1]) : null;

  // Tamper check: the returned token must match the httpOnly tmdb_rt cookie
  // minted by /api/auth/request-token, and the user must have approved.
  if (approved !== 'true' || !requestToken || !rtCookie || rtCookie !== requestToken) {
    return redirect('/lists?auth=error', ERROR_COOKIES);
  }

  const sessionResult = await tmdb('/authentication/session/new', {
    method: 'POST',
    jsonBody: { request_token: requestToken },
  });
  if (!sessionResult.ok || typeof sessionResult.data.session_id !== 'string') {
    return redirect('/lists?auth=error', ERROR_COOKIES);
  }
  const sessionId = sessionResult.data.session_id;

  // Display profile (best-effort — a failure here must not block login).
  const account = await tmdb('/account', { sessionId });
  const payload = account.ok ? toAccountPayload(account.data) : null;

  const cookies = [
    sessionCookie(sessionId),
    clearingCookies(COOKIE.requestToken)[0],
  ];
  if (payload) {
    cookies.push(
      profileCookie({
        username: payload.username,
        name: payload.name,
        avatar: payload.avatar,
        account_id: payload.id,
      }),
    );
  }

  return redirect('/lists', cookies);
}) satisfies FunctionHandler;
