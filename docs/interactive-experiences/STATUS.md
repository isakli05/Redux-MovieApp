# Interactive Experiences — Program Status

Baseline evidence (pre-branch, master @ 3affa46): typecheck ✅ · lint ✅ (0 errors / 13 pre-existing warnings) · vitest ✅ 269/269 (41 files).

| Feature | PM agent | Branch | Worktree | State | Integrated | Blockers |
|---|---|---|---|---|---|---|
| F1 Seans | pm-seans | feature/lmdb-seans | wt/seans | delivered (f757df1, 5761aef) | merged + DNA taste bridge wired by Master (91532b9, 48d93a5) — 408/408 integration tests | none |
| F2 Cinema DNA | pm-cinema-dna | feature/lmdb-cinema-dna | wt/dna | delivered (3c82598) | merged @ 4e1ca56 — independently verified 300/300 | watchlist import consciously excluded (honest-event-kind rule, contracts §D) |
| F3 Cinema Universe | pm-cinema-universe | feature/lmdb-cinema-universe | wt/universe | delivered (1e005f3) | merged @ e3e207c — independently verified 300/300 | read-only feature (no preference events) by Master decision |
| F4 Group Choice | pm-group-choice | feature/lmdb-group-choice | wt/group | attempt 3 running (anti-freeze protocol: no browser phase, unit commits) | — | two prior agents froze in browser-verification phases (hung headless-eval, 30-min MCP timeouts); salvage untracked in worktree |
| F5 Daily Mystery | pm-daily-mystery | feature/lmdb-daily-mystery | wt/mystery | delivered (8100e6e, incl. seed-id corrections) | merged @ HEAD — independently verified 316/316 + functions tsc clean | rate-limit is per-instance (documented; acceptable, no prize pool) |
| F6 TV Tracker | pm-tv-tracker | feature/lmdb-tv-tracker | wt/tvtracker | delivered (5513093) | merged @ 826ec62 — independently verified: 307/307 tests, typecheck/lint clean | none; detail-page mounts deferred to unified integration pass |

Environment: Claude Code 2.1.281 · model glm-5.3 · spawn depth 2 verified by
smoke test (PM spawned specialist, specialist answered, chain healthy) ·
Graphify 0.9.50 graph fresh (2026-11-01, tree clean).

PMs update their row via reports; the Master maintains this file.
