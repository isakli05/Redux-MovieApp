# Interactive Experiences — Program Status

Baseline evidence (pre-branch, master @ 3affa46): typecheck ✅ · lint ✅ (0 errors / 13 pre-existing warnings) · vitest ✅ 269/269 (41 files).

| Feature | PM agent | Branch | Worktree | State | Integrated | Blockers |
|---|---|---|---|---|---|---|
| F1 Seans | pm-seans | feature/lmdb-seans | wt/seans | in progress (f757df1 core ranker) | — | — |
| F2 Cinema DNA | pm-cinema-dna | feature/lmdb-cinema-dna | wt/dna | not started | — | — |
| F3 Cinema Universe | pm-cinema-universe | feature/lmdb-cinema-universe | wt/universe | not started | — | — |
| F4 Group Choice | pm-group-choice | feature/lmdb-group-choice | wt/group | not started | — | — |
| F5 Daily Mystery | pm-daily-mystery | feature/lmdb-daily-mystery | wt/mystery | not started | — | — |
| F6 TV Tracker | pm-tv-tracker | feature/lmdb-tv-tracker | wt/tvtracker | delivered (5513093) | merged @ 826ec62 — independently verified: 307/307 tests, typecheck/lint clean | none; detail-page mounts deferred to unified integration pass |

Environment: Claude Code 2.1.281 · model glm-5.3 · spawn depth 2 verified by
smoke test (PM spawned specialist, specialist answered, chain healthy) ·
Graphify 0.9.50 graph fresh (2026-11-01, tree clean).

PMs update their row via reports; the Master maintains this file.
