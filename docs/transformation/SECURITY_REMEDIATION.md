# Security Remediation Plan

Assessment date: 2026-10-31. No secret values appear in this document (names/shapes only).

## Findings (verified)

1. **Tracked `.env` on origin/master** contains a real v3 API key (32-hex) and a real v4 read access token (JWT, 239 chars), both `VITE_`-prefixed. 6 commits in history carry 5 distinct credential generations (commits: 85ef20c, e3bd0a8, 104da9d, 3c16a19, 2b403b2, 0274c88). Assume all compromised.
2. The v3 key is inlined into the production bundle and sent as `api_key` query param on every call (`src/api/tmdb.api.ts:40-41`). The v4 token was dead code in the client (never sent) — delete it.
3. `session_id` stored in `localStorage['tmdb_user']` and sent as query param on every request (`tmdb.api.ts:45-48`) — XSS-readable, log-leakable.
4. Auth defects M (no session validation on restore), N (logout is local-only; remote session DELETE exists but unused), O (AuthCallback has a dead 200ms poller with stale closure + duplicate navigate + competing redirects) — all confirmed.
5. `npm audit`: 21 vulnerabilities (1 critical: swiper prototype pollution; high: react-router-dom XSS, postcss, vite, rollup chain).
6. Netlify: no CSP, no HSTS, no Permissions-Policy; no functions.

## Credential classification & action

| Credential | Class | Action |
|---|---|---|
| v3 API key (current + all history generations) | exposed, must rotate | Owner generates NEW key in TMDB settings → new key deployed via Netlify env → old key revoked after cutover |
| v4 read access token | exposed, unused | Revoke/delete in TMDB settings; remove from client code & `.env` entirely |
| `.env` tracking | repo hygiene | `git rm --cached .env` (keep local for dev); `.env` stays gitignored; `.env.example` placeholders only |

## Target architecture (decided — D1)

Minimal Netlify Functions BFF (`netlify/functions/`), all user-auth traffic proxied; catalog reads stay client-direct with rotated v3 key.

- `POST /api/auth/request-token` — wraps `/3/authentication/token/new`, injects key server-side, returns request token.
- `GET /api/auth/callback?request_token=&approved=` — exchanges for `session_id` via `/3/authentication/session/new`, sets httpOnly `Secure SameSite=Lax` cookie `tmdb_session`, fetches `/3/account` for display profile, redirects to `/lists`. (Replaces broken client exchange; fixes O.)
- `POST /api/auth/logout` — `DELETE /3/authentication/session`, clears cookie. (Fixes N.)
- `GET /api/auth/session` — validates cookie session against `/3/account`; client boots auth from this. (Fixes M.)
- `GET|POST|PUT|DELETE /api/lists*` — v3 list CRUD + `/3/account/{id}/lists`.
- `POST /api/account/favorite|watchlist|rating*` + `GET /api/account/*` — favorites, watchlist (movie+TV), ratings.

Hardening: method-scoped routes (no generic passthrough), `X-Requested-With: fetch` check on mutations (CSRF, paired with SameSite=Lax), errors sanitized (no upstream echo), no full-URL logging, per-IP throttling consideration at release. Cookie is bearer-equivalent → httpOnly + Secure + Lax, no `domain` relaxation.

Client: `tmdb_user` display profile (username/avatar only, non-sensitive) in Redux; no session credential in JS reachable storage. baseQuery drops session_id from query strings; user-surface hooks call `/api/*` on same origin.

Netlify headers to add: CSP (`default-src 'self'; img-src https://image.tmdb.org ...; connect-src 'self' https://api.themoviedb.org; frame-src https://www.youtube.com; media-src ...`), HSTS, Permissions-Policy. Remove deprecated `X-XSS-Protection`.

Dependencies: upgrade swiper (≥ safe version), react-router-dom, vite toolchain at Wave 4/5; re-run `npm audit` as release gate.

## Git history purge (requires explicit owner authorization — NOT executed)

Procedure prepared: `git filter-repo --path .env --invert-paths` → verify with `git log --all -- .env` → force-push all branches → all clones invalid. **Irreversible and rewrites public history.** Rotation makes purge optional for security (a rotated key in history is harmless), but purge is still recommended for hygiene. Decision belongs to the owner.

## ROTATION COMPLETED (2026-11-01)

- New v3 API key generated via TMDB panel (owner entered password; confirm handled); old exposed key **disabled by TMDB** — all 5 historical generations now dead.
- Netlify env updated (VITE_TMDB_API_KEY + TMDB_API_KEY, all contexts) → deployed → verified: live bundle embeds the new key only; catalog reads confirmed (Fight Club fetch + live /movie page).
- v4 read access token rotated together with the key (regeneration refreshes both); it remains unused by the codebase (removed in Wave 3b-2).
- Residual: historical commits still CONTAIN the old (now-dead) values. Purge is now optional hygiene only (D6 — needs explicit owner authorization).

## Owner action checklist (all completed)

1. Open TMDB API settings (authenticated) → create new v3 API key. (Old keys: revoke AFTER new key deployed & verified.)
2. Delete/revoke the v4 read access token (unused by the app).
3. Add new key to Netlify env (`VITE_TMDB_API_KEY`) at cutover.
4. Decide on history purge authorization (optional).
