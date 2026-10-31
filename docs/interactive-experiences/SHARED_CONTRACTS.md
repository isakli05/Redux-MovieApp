# LMDB Interactive Experiences — Shared Technical Contracts

Owner: Master PM (integration branch `feature/lmdb-interactive-experiences`).
These contracts bind all six feature PMs. A PM may propose a change via its
report; only the Master may amend this file. Last updated: base commit.

## A. User identity

- **Authenticated users**: existing TMDB session via the Netlify BFF cookie
  (`useAuth()` in `src/hooks/useAuth.ts`, functions in `netlify/functions/auth-*.ts`).
  The numeric TMDB `account_id` is the canonical user key. No new auth flows.
- **Anonymous users**: a local device id (`lmdb:deviceId`, UUID, created lazily
  by `src/lib/interactions.ts`). Anonymous data lives only in this browser.
- **Group room guests**: opaque participant ids scoped to one room
  (`p_<random>`), created at join time. A guest is NOT an LMDB account and
  never gains access to another participant's local taste data.
- **Anonymous → account migration**: on login, feature-local stores merge the
  `:local` scope into the `:acct:<accountId>` scope (see §E). Never delete the
  local scope silently; merging is additive (union by event id).

## B. User preferences — the interaction log (single source of truth)

All preference-shaped signals from Seans, Cinema DNA, Group Choice, Daily
Mystery and TV Tracker are appended to one normalized log:
`src/lib/interactions.ts` (typed events, localStorage-backed, reactive via
`useInteractionLog`).

- Event kinds: `like`, `dislike`, `seen`, `rating` (1–10), `comparison_win` /
  `comparison_lose` (pairwise, `vs` field), `seans_reject`, `episode_watched`
  (season/episode fields), `follow_show`.
- Every event carries: unique `id`, `target: MediaRef`, optional `vs`, `value`,
  `season`, `episode`, `at` (epoch ms), `source` (`seans|dna|tracker|group|mystery|manual`).
- Features READ the log through the query API and WRITE through
  `logInteraction`. No feature keeps a second, incompatible like/dislike store.
- Cinema DNA derives its profile from this log (+ optional one-time import of
  TMDB account favorites/ratings, which are also folded in as events with
  `source: 'manual'`).

## C. Media identity

- `MediaRef = { kind: 'movie' | 'tv' | 'person'; id: number; title?; posterPath? }`
  (`src/lib/mediaRef.ts`). Canonical key: `` `${kind}:${id}` `` — movie 123 and
  tv 123 are never conflated.
- Detail routes remain `/movie/:id`, `/tv/:id`, `/person/:id`.

## D. API surface

- TMDB **v3 only**, and only through the existing Netlify Functions BFF
  (`netlify/functions/_shared/tmdb.ts`). The browser never calls
  `api.themoviedb.org` directly (CSP `connect-src` stays `'self'`).
- New server endpoints: one file per function, Functions v2 in-source
  `config.path` under `/api/*`, secrets via `process.env` only.
- The shared `tmdb()` helper owns error shape and rate behavior; reuse it.

## E. Persistence

| Data | Where | Notes |
|---|---|---|
| Interaction log | `localStorage['lmdb:interactions' + scope]`, scope = `` (anon) or `@acct:<id>` | capped, merge-on-login (§A) |
| Cinema DNA profile | derived from the log + `lmdb:dna:*` cache | fully reconstructable; user can inspect/delete |
| TV progress | `lmdb:tracker:*` (per-scope), sourced from `episode_watched`/`follow_show` events | undo = event removal |
| Daily mystery state | `lmdb:mystery:*` (streak, played days) | local; optional future sync |
| Seans session | ephemeral React state + `lmdb:seans:history` | short history only |
| Group rooms | **Netlify Blobs** via server-only functions | room doc + participant votes; clients poll ≤ 5 s; TTL 24 h; no WebSockets |
| Daily mystery answers | never shipped to the client | clue/guess functions validate server-side |

- The TMDB account is NOT a general database. TMDB lists/favorites/ratings are
  read-only evidence sources for DNA import.
- No new external paid services. Netlify Blobs runs inside the existing
  Netlify account (free tier; documented in the release report).

## F. Design system

- Cinematic Atlas tokens only: `bg-surface-void/-raised/-overlay`,
  `text-primary/secondary/muted`, `accent`, `font-display` (Fraunces),
  `ease-cine`, `glass-bar`, `shadow-cine`, existing `src/components/ui/*`.
- User-facing copy is Turkish (match existing tone; see Navbar/Home copy).
- New routes are lazy-loaded chunks; heavy visuals (graph canvas, game board)
  load inside their page chunk only. Respect `prefers-reduced-motion`
  (`usePrefersReducedMotion` exists in `src/components/Home/`).
- WCAG 2.2 AA: keyboard paths, focus rings (`FOCUS_RING` pattern), aria labels,
  contrast — every PM verifies its own surfaces.

## G. File ownership (conflict-free parallelism)

Master-owned after the base commit — PMs do not edit; request via report:
`src/App.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`,
`src/components/Home/*`, `src/lib/mediaRef.ts`, `src/lib/interactions.ts`,
`src/components/ui/*`, `package.json`, `package-lock.json`, `netlify.toml`,
`.gitignore`, `netlify/functions/_shared/*`, `src/api/*`, `vite.config.ts`.

| PM | Owns (exclusive write) |
|---|---|
| pm-seans | `src/Pages/Seans.tsx`, `src/components/Seans/**`, `src/lib/seans/**`, `src/test/seans/**` |
| pm-cinema-dna | `src/Pages/SinemaDna.tsx`, `src/components/SinemaDna/**`, `src/lib/dna/**`, `src/test/dna/**` |
| pm-cinema-universe | `src/Pages/SinemaEvreni.tsx`, `src/components/Universe/**`, `src/lib/universe/**`, `src/test/universe/**` |
| pm-group-choice | `src/Pages/BirlikteIzle.tsx`, `src/components/GroupChoice/**`, `src/lib/group/**`, `netlify/functions/rooms*.ts`, `src/test/group/**` |
| pm-daily-mystery | `src/Pages/GunlukBilmece.tsx`, `src/components/Mystery/**`, `src/lib/mystery/**`, `netlify/functions/daily-mystery*.ts`, `src/test/mystery/**` |
| pm-tv-tracker | `src/Pages/Takip.tsx`, `src/components/Tracker/**`, `src/lib/tracker/**`, `src/test/tracker/**` |

- Detail-page integration (buttons/panels on Movie/Tv/Person pages) and Home
  entry points happen at INTEGRATION time, mounted by the Master from
  self-contained components each PM delivers under its own directory
  (e.g. `src/components/Tracker/TvProgressPanel.tsx`). PMs do not edit
  `src/Pages/Movies/*`, `src/Pages/Tvs/*`, `src/Pages/Persons/*`, or Home.
- Dependencies: `d3-force` and `qrcode` are pre-installed on the base for
  pm-cinema-universe / pm-group-choice. Any other new dependency is a Master
  decision — request it in your report with justification.

## H. Feature interop

- Seans ↔ DNA: both read the interaction log; Seans consumes DNA's exported
  taste weights via `src/lib/dna/profile.ts` (read-only import) — DNA never
  imports Seans internals.
- Universe → Seans: universe nodes deep-link to `/seans?seed=movie:123`
  ("buna benzer bir şey öner"); Seans reads the `seed` param.
- Universe → lists: links to existing detail pages; saving uses existing
  account features. No new list API.
- DNA → Group: only an explicit user action exports an anonymous taste summary
  (genre weights, no titles, no identity) into a room.
- Tracker → Seans: `episode_watched`/`seen` events are Seans exclusions.
- Mystery → Universe: after a completed challenge, link the answer's factual
  page; never reveal before completion.
