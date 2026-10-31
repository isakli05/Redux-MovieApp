# Release Verification — 2026-10-31

Environment: local production build (`vite build` → `vite preview`, port 5200), Chrome 154 headless via DevTools MCP, mobile emulation 390x844x2 (mobile,touch) + 4× CPU throttle for CLS attribution.

## Gates (all measured on the release-candidate build)

| Gate | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS — 0 errors repo-wide |
| `vitest run` | PASS — 259 tests / 38 files (incl. 25/25 BFF function smoke tests) |
| `tsc -p netlify/functions` | PASS |
| `vite build` | PASS — 504 kB entry (163 kB gzip) + 25 lazy route chunks (was 825 kB single chunk) |
| `npm audit` | 0 high / 14 moderate (all dev-chain transitive; was 1 critical + 14 high) |

## Lighthouse (mobile, production preview)

| Category | Baseline (live site) | Release candidate |
|---|---|---|
| Accessibility | 93 | **100** |
| Best Practices | 100 | **100** |
| SEO | 92 | **100** |
| Agentic Browsing | 25 | **75** |

- CLS: 0.021 measured with PerformanceObserver under 4× CPU throttle (was 0.406 before the Suspense-fallback/footer and hero-height fixes; Lighthouse now passes the CLS audit).
- LCP 276 ms, CLS 0.00 in unthrottled trace.
- Console: 0 errors, 0 warnings across the verified journey (home → movie detail → /kesfet → /search?q=dune → /tv/1396/seasons → /person/287).
- Known not-implemented: `ai-catalog.json` (experimental ARD spec — the only remaining Lighthouse fail).
- Visual QA (model-reviewed screenshots): home 8/10 desktop, 7.5/10 real mobile, person/detail verified structurally via a11y tree. Edge-fade affordance and section spacing addressed.

## Functional journey verified locally

Home (hero auto-advance + reduced-motion pause, 8 rails incl. region-aware Ücretsiz İzle + JustWatch note, Son Baktıklarınız) · Movie detail (dossier, tabs, providers, SEO title) · Search (URL state, real counts, pagination) · Discover /kesfet (URL-stateful filters) · Seasons list/detail (lazy media) · Person (bio, career tabs w/ counts, external links) · Navbar (glass, ⌘K dialog, mobile drawer verified at 390px — hamburger visible, desktop nav display:none) · Footer (TMDB + JustWatch attribution).

NOT verified locally (requires deploy): Netlify Functions auth/list flows end-to-end (logic covered by 25/25 handler smoke tests with mocked upstream; real TMDB round-trip needs the deployed site), CSP header behavior, real-key rotation.

## Deploy checklist (owner actions)

1. TMDB settings (authenticated): generate NEW v3 API key; delete the exposed v4 read access token; revoke old keys only AFTER cutover.
2. Push/merge `feature/cinematic-transformation` → Netlify (branch deploy or merge to master).
3. Netlify site settings → environment variables: add `TMDB_API_KEY` (server-side, NOT VITE_-prefixed). `VITE_TMDB_API_KEY` (rotated value) also needed for client catalog reads.
4. Deploy; then verify on the live URL: `/api/auth/session` returns `{"authenticated":false}`; login → lists flow; home renders.
5. Optional (needs explicit owner authorization, irreversible): purge `.env` from git history via `git filter-repo --path .env --invert-paths` + force-push (procedure in SECURITY_REMEDIATION.md). Rotation already neutralizes the leaked values.
6. Rollback: redeploy previous master deploy from Netlify UI; `master` branch is untouched until merge.

## Deferred (documented, not blockers)

- Watch-provider filter in Discover (needs master provider list endpoint — v1.1 candidate)
- Genre chips use a static Turkish map (deliberate: better Turkish UX than API's English names)
- `ai-catalog.json` ARD manifest
- 14 moderate dev-chain audit advisories (eslint/glob transitive — no runtime exposure)
