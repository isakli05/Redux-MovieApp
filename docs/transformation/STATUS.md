# LMDB Transformation — Status

Branch: `feature/cinematic-transformation` (base: master @ 6a7f55c6). Owner reports in Turkish.

## Current wave

| Wave | Status |
|---|---|
| 0 — Init (clone, branch, Graphify, env) | ✅ Done |
| 1 — Parallel discovery (4 agents) | ✅ Done |
| 2 — Synthesis, contracts, decisions | ✅ Done (this document set) |
| 3 — Core visual implementation | ✅ Done (foundation + 7 parallel surface agents) |
| 4 — API/security/feature integration | ✅ Done (BFF, rotation-ready, audit 0 high) |
| 5 — Polish & verification | ✅ Done (Lighthouse 100/100/100, CLS 0.02, 259 tests) |
| 6 — Release preparation | ✅ RC verified locally; deploy blocked on owner actions (see RELEASE_VERIFICATION.md) |

## Verified baseline (evidence: BASELINE.md, agent reports 2026-10-31)

- Build: PASS (`tsc && vite build`, 825 kB single chunk — needs code splitting). Typecheck: PASS. Lint: FAIL (no ESLint config exists; ESLint 9 installed).
- Live app: 0 console errors, LCP 553 ms desktop / 282 ms mobile, CLS 0.00, Lighthouse a11y 90–93, SEO 92, Agentic 25.
- Defects B–V and M/N/O: **all CONFIRMED** with file:line evidence (see below).
- Security: real v3 API key + v4 JWT in tracked `.env`, 6 commits / 5 credential generations in history, pushed to origin/master. Treat as compromised.

## Decisions (D-numbers are the contract for all agents)

- **D1 — TMDB API strategy.** v3 for ALL catalog reads (client-direct with rotated key). v3 `session_id` for user auth. All user-write flows (auth exchange, account, lists, favorites, watchlist, ratings) go through a minimal Netlify Functions BFF holding the session in an httpOnly cookie. v4 access token is **removed** from the client entirely (it was dead code). v4 not adopted: undocumented token lifecycle + second auth surface; mixed movie/TV custom lists deferred (v3 lists are movie-only — documented product constraint).
- **D2 — Design direction: "Cinematic Atlas"** (dark-first cinematic editorial). Full spec: DESIGN_DIRECTION.md. Gold/amber accent, Fraunces display + Inter body (latin-ext), layered near-black surfaces, editorial rails.
- **D3 — Architecture stays** React 18 + Vite + RTK Query + React Router 7 + Tailwind 3. Add: route-level lazy loading, flat ESLint config, Vitest + RTL (+ Playwright smoke later). No framework migration.
- **D4 — Listing consolidation.** One parameterized listing system (grid + rail, modes: hybrid/hybrid+pagination) replaces Movies/TVs/MoviesInfinite/MoviesPaginated/4 near-clone secondary pages. Dead files deleted.
- **D5 — Media model.** Discriminated union on `media_type` (movie/tv/person) at the API boundary fixes E/F/G together. Region is a first-class setting (user-selectable, default derived from browser locale, validated against `/watch/providers/regions`), always sent with watch filters (fixes I). Free content via `discover + with_watch_monetization_types=free` (fixes H).
- **D6 — Git history rewrite NOT executed.** Requires explicit owner authorization (irreversible force-push). Credential rotation is the primary remediation; history purge procedure documented in SECURITY_REMEDIATION.md.
- **D7 — Attribution.** TMDB logo + "This product uses the TMDB API but is not endorsed or certified by TMDB" in footer/About; JustWatch attribution wherever provider data is shown. Mandatory per terms.

## Validation status

- Baseline build/typecheck: PASS. Lint: FAIL → fix in Wave 3.
- All Wave-1 agent claims spot-verified in primary context (5/5 checked: route casing, query-param auth, unguarded toFixed, dead files, trending typing).

## External blockers / owner actions

1. **Credential rotation** (owner + TMDB settings page, authorized but requires owner's authenticated session — Chrome tab not currently open). Until rotation, exposed key remains valid.
2. **History purge** authorization (optional but recommended; see SECURITY_REMEDIATION.md).
3. Netlify env vars + functions deploy access at release time.

## Next objectives

Wave 3: design tokens → UI primitives → shell/routes → Home → detail pages → search/discover → person/seasons → lists/auth. Then Wave 4 integration, Wave 5 verification.


## Post-verification addendum (2026-10-31)

- 7 commits on `feature/cinematic-transformation` through `97e4032`.
- Defect scoreboard: A (env untracked; rotation pending owner), B–L, M/N/O, P–V: FIXED and covered by tests or browser verification.
- Deferred: Discover provider filter, ai-catalog.json, history purge (owner decision D6).
