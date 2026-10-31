/**
 * Shared helpers for the LMDB BFF (Netlify Functions v2).
 *
 * Architecture (docs/transformation/SECURITY_REMEDIATION.md, decision D1):
 * - The TMDB v3 API key lives ONLY in `process.env.TMDB_API_KEY` (server-side,
 *   never `VITE_`-prefixed, never shipped to the browser bundle).
 * - The v3 session_id lives ONLY in the httpOnly `tmdb_session` cookie and is
 *   appended to upstream calls here — it is unreachable from page JS.
 * - All responses are JSON. Errors are sanitized: no upstream bodies, no
 *   stack traces, no credential-bearing URLs are echoed to clients.
 * - Mutating routes must call `requireMutationHeader` (CSRF hardening paired
 *   with the SameSite=Lax session cookie).
 */

/** Minimal structural types for Netlify Functions v2 handlers (no SDK needed). */
export interface FunctionContext {
  /** Express-style path params when the function is matched with `[param]` segments. */
  params?: Record<string, string | undefined>;
}

export type FunctionHandler = (req: Request, context: FunctionContext) => Promise<Response>;

const TMDB_BASE = 'https://api.themoviedb.org/3';

/** Cookie names used by the BFF (single source of truth). */
export const COOKIE = {
  session: 'tmdb_session',
  requestToken: 'tmdb_rt',
  profile: 'tmdb_profile',
} as const;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Read a named cookie from the incoming `Cookie` header. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return part.slice(eq + 1).trim();
    }
  }
  return null;
}

export interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  /** Omit to keep the cookie until it expires; set to delete. */
  path?: string;
}

/** Serialize a Set-Cookie value with the BFF's fixed hardening flags. */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const { maxAge, httpOnly = false, path = '/' } = options;
  const parts = [`${name}=${value}`, `Path=${path}`, 'SameSite=Lax', 'Secure'];
  if (httpOnly) parts.push('HttpOnly');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

/** Session cookie: httpOnly + Secure + SameSite=Lax + Path=/ + 1 year. */
export function sessionCookie(sessionId: string): string {
  return serializeCookie(COOKIE.session, sessionId, {
    httpOnly: true,
    maxAge: ONE_YEAR_SECONDS,
  });
}

/** Short-lived mirror of the request token for callback verification. */
export function requestTokenCookie(token: string, maxAgeSeconds = 3600): string {
  return serializeCookie(COOKIE.requestToken, token, { httpOnly: true, maxAge: maxAgeSeconds });
}

/** Base64url JSON of display-only profile data. NOT httpOnly by design (client hydrates UI). */
export function profileCookie(profile: unknown): string {
  // base64url over UTF-8 bytes — Turkish characters must survive the cookie.
  const b64 = Buffer.from(JSON.stringify(profile), 'utf8').toString('base64url');
  return serializeCookie(COOKIE.profile, b64, { maxAge: ONE_YEAR_SECONDS });
}

/** `Set-Cookie: name=; Max-Age=0` for every cookie the BFF owns. */
export function clearingCookies(...names: readonly string[]): string[] {
  return names.map((name) => serializeCookie(name, '', { maxAge: 0 }));
}

/** JSON response helper. Multiple Set-Cookie values become separate headers. */
export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
  setCookies: string[] = [],
): Response {
  const merged = new Headers({ 'content-type': 'application/json; charset=utf-8', ...headers });
  for (const cookie of setCookies) merged.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers: merged });
}

export interface ApiErrorBody {
  error: { code: string; message?: string; status_code?: number };
}

/**
 * Sanitized JSON error. Never echo TMDB bodies/URLs; optionally pass the TMDB
 * numeric `status_code` (a plain number, safe for clients) for handling like
 * duplicate-add (8) or unknown ids (11/34).
 */
export function apiError(
  status: number,
  code: string,
  message?: string,
  statusCode?: number,
  setCookies: string[] = [],
): Response {
  const body: ApiErrorBody = {
    error: { code, ...(message ? { message } : {}), ...(statusCode ? { status_code: statusCode } : {}) },
  };
  return json(status, body, {}, setCookies);
}

/** 403 unless the mutation header is present (CSRF check). */
export function isMutationAuthorized(req: Request): boolean {
  return req.headers.get('x-requested-with') === 'fetch';
}

/** Upstream call result: either parsed JSON data or a sanitized failure. */
export type TmdbResult =
  | { ok: true; status: number; data: Record<string, unknown> }
  | { ok: false; status: number; statusCode?: number };

interface TmdbCallOptions {
  method?: string;
  /** v3 session id — appended server-side, never exposed to the client. */
  sessionId?: string | null;
  query?: Record<string, string | number | undefined>;
  /** JSON body (sent as application/json). */
  jsonBody?: Record<string, unknown>;
  /** Form-encoded body (v3 add_item/remove_item expect this). */
  formBody?: Record<string, string | number>;
}

/** The server-side TMDB v3 key. Throws a typed marker when unset. */
export function tmdbApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key || key.length === 0) {
    throw new Error('TMDB_API_KEY_MISSING');
  }
  return key;
}

/**
 * Call TMDB v3 upstream with the API key (and optional session) injected.
 * Returns a sanitized result — upstream bodies are consumed here and never
 * returned verbatim to the client.
 */
export async function tmdb(path: string, options: TmdbCallOptions = {}): Promise<TmdbResult> {
  const { method = 'GET', sessionId = null, query = {}, jsonBody, formBody } = options;

  let apiKey: string;
  try {
    apiKey = tmdbApiKey();
  } catch {
    return { ok: false, status: 500 };
  }

  const url = new URL(path.startsWith('/') ? `${TMDB_BASE}${path}` : path);
  url.searchParams.set('api_key', apiKey);
  if (sessionId) url.searchParams.set('session_id', sessionId);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      url.searchParams.set(key, `${value}`);
    }
  }

  let init: RequestInit = { method };
  if (formBody) {
    init = {
      ...init,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(
        Object.fromEntries(Object.entries(formBody).map(([k, v]) => [k, `${v}`])),
      ).toString(),
    };
  } else if (jsonBody) {
    init = { ...init, headers: { 'content-type': 'application/json' }, body: JSON.stringify(jsonBody) };
  }

  try {
    const res = await fetch(url, init);
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        statusCode: typeof data.status_code === 'number' ? data.status_code : undefined,
      };
    }
    return { ok: true, status: res.status, data };
  } catch {
    // Network/timeout failure — sanitized, no upstream detail.
    return { ok: false, status: 502 };
  }
}

/** Require the `tmdb_session` cookie; returns the id or a 401 response. */
export function requireSession(
  req: Request,
): { sessionId: string } | { response: Response } {
  const sessionId = readCookie(req, COOKIE.session);
  if (!sessionId) {
    return { response: apiError(401, 'unauthenticated', 'Bu işlem için giriş yapmalısınız.') };
  }
  return { sessionId };
}

/** The v3 session id from the cookie, or null (used by best-effort flows). */
export function sessionFromCookie(req: Request): string | null {
  return readCookie(req, COOKIE.session);
}

/** Redirect (302) response carrying Set-Cookie headers. */
export function redirect(location: string, setCookies: string[] = []): Response {
  const headers = new Headers({ location });
  for (const cookie of setCookies) headers.append('set-cookie', cookie);
  return new Response(null, { status: 302, headers });
}

/** Parse a JSON object body; returns null on malformed input. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Extract a positive integer field from a JSON body. */
export function positiveInt(value: unknown): number | null {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Extract a trimmed non-empty string field from a JSON body. */
export function nonEmptyString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

/** Map a client mediaType ('movie'|'tv') to the v3 segment; null otherwise. */
export function mediaTypeSegment(value: unknown): 'movie' | 'tv' | null {
  return value === 'movie' || value === 'tv' ? value : null;
}

/**
 * Resolve the authenticated account id by validating the session cookie
 * against `/3/account`. Returns the id, or a sanitized error response.
 */
export async function resolveAccountId(
  sessionId: string,
): Promise<{ accountId: number } | { response: Response }> {
  const result = await tmdb('/account', { sessionId });
  if (!result.ok || typeof result.data.id !== 'number') {
    return { response: apiError(401, 'unauthenticated', 'Bu işlem için giriş yapmalısınız.') };
  }
  return { accountId: result.data.id };
}

/** Display account shape returned by /api/auth/session. */
export interface AccountPayload {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

/** Normalize a `/3/account` payload into the public display shape. */
export function toAccountPayload(data: Record<string, unknown>): AccountPayload | null {
  if (typeof data.id !== 'number' || typeof data.username !== 'string') return null;
  const avatar =
    typeof data.avatar === 'object' && data.avatar !== null
      ? ((data.avatar as Record<string, unknown>).tmdb as unknown)
      : null;
  const avatarPath = typeof avatar === 'object' && avatar !== null
    ? ((avatar as Record<string, unknown>).avatar_path as unknown)
    : null;
  return {
    id: data.id,
    username: data.username,
    name: typeof data.name === 'string' ? data.name : '',
    avatar: typeof avatarPath === 'string' ? avatarPath : null,
  };
}
