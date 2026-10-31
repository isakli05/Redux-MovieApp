# LMDB BFF — Netlify Functions (v2, TypeScript)

Same-origin backend-for-frontend that owns everything user-authenticated:
the TMDB v3 API key, the v3 session, and all user-surface writes
(decision D1, docs/transformation/SECURITY_REMEDIATION.md). Catalog reads
stay client-direct.

## Route map

| Route | TMDB call | Cookie effects |
|---|---|---|
| `POST /api/auth/request-token` | `GET /3/authentication/token/new` | sets `tmdb_rt` (httpOnly, 1 h) |
| `GET /api/auth/callback?request_token=&approved=` | `POST /3/authentication/session/new`, `GET /3/account` | sets `tmdb_session` (httpOnly, 1 y) + `tmdb_profile` (base64, display-only) — clears `tmdb_rt`; failure → 302 `/lists?auth=error` |
| `POST /api/auth/logout` | `DELETE /3/authentication/session` (best-effort) | clears `tmdb_session`, `tmdb_profile`, `tmdb_rt` |
| `GET /api/auth/session` | `GET /3/account` (only if session cookie) | clears stale session cookie on invalid session |
| `GET /api/lists?accountId=&page=` | `GET /3/account/{id}/lists` | — |
| `POST /api/lists` `{name, description?}` | `POST /3/list` | — |
| `GET /api/lists/:id?page=` | `GET /3/list/{id}` | — (public list data) |
| `POST /api/lists/:id/update` `{name, description?}` | `POST /3/list/{id}/update` | — |
| `POST /api/lists/:id/items` `{mediaId}` | `POST /3/list/{id}/add_item` (form) | — |
| `DELETE /api/lists/:id/items` `{mediaId}` | `POST /3/list/{id}/remove_item` (form) | — |
| `DELETE /api/lists/:id?confirm=true` | `POST /3/list/{id}/clear` → `DELETE /3/list/{id}` | — |
| `POST /api/account/favorite` `{mediaType, mediaId, favorite}` | `GET /3/account`, `POST /3/account/{id}/favorite` | — |
| `GET /api/account/favorites?mediaType=&page=` | `GET /3/account/{id}/favorite/{movies\|tv}` | — |
| `POST /api/account/watchlist` `{mediaType, mediaId, watchlist}` | `POST /3/account/{id}/watchlist` | — |
| `GET /api/account/watchlist?mediaType=&page=` | `GET /3/account/{id}/watchlist/{movies\|tv}` | — |
| `POST /api/account/rating` `{mediaType, mediaId, value}` | `POST /3/{movie\|tv}/{id}/rating` | — |
| `DELETE /api/account/rating` `{mediaType, mediaId}` | `DELETE /3/{movie\|tv}/{id}/rating` | — |
| `GET /api/account/rated?mediaType=&page=` | `GET /3/account/{id}/rated/{movies\|tv}` | — |

`/api/*` is rewritten to `/.netlify/functions/:splat` in `netlify.toml`
(placed before the SPA catch-all). `[id]` file names are dynamic URL slugs;
handlers also parse the id from `req.url` as a fallback.

## Hardening rules (enforced in `_shared/tmdb.ts`)

- The API key is read **only** from `process.env.TMDB_API_KEY` — never a
  `VITE_`-prefixed variable (those are bundled into the browser).
- The session id exists **only** in the httpOnly `Secure SameSite=Lax
  Path=/` `tmdb_session` cookie (1 year) — page JS can never read it.
- Every mutating route rejects requests without the `x-requested-with: fetch`
  header (403), pairing CSRF protection with SameSite=Lax.
- All responses are JSON; errors carry `{error:{code, message?, status_code?}}`
  with sanitized messages — upstream bodies, URLs, and stack traces are never
  echoed.
- v3 lists are **movie-only** (TMDB product constraint); `mediaId` is a movie id.

## Local development

Plain `vite dev` does NOT serve these functions. Two options:

1. **Recommended:** `netlify dev` (runs Vite + Functions together, reads `.env`):
   ```sh
   # .env (gitignored — never commit a key)
   TMDB_API_KEY=<your v3 key>
   netlify dev
   ```
2. Plain `npm run dev` will still boot the app; the client degrades
   gracefully: `/api/auth/session` 404s are treated as "unauthenticated", so
   the UI shows the logged-out state without crashing.

A `tsc` project for this directory exists for editor/type checking:
```sh
npx tsc --noEmit -p netlify/functions
```

## Deploy checklist

- Set the `TMDB_API_KEY` environment variable in the Netlify UI
  (Site configuration → Environment variables). This is the **rotated** key —
  see docs/transformation/SECURITY_REMEDIATION.md.
- Never commit `.env` or any key material. `_shared/` is excluded from
  function publishing (underscore prefix).
