# LMDB Production Baseline — Pre-Redesign Audit

## Environment

| Item | Value |
|---|---|
| Date | 2026-10-31 (evening, ~19:10–19:55 local) |
| Target | https://isa-kaya-movieapp.netlify.app/ |
| Browser | Chrome (stable), driven via chrome-devtools MCP, real network (no throttling unless noted) |
| Viewports tested | 390x844, 768x1024, 1440x900, 1920x1080 |
| Auth state | Logged out (public surfaces only). "Giriş Yap" / "TMDB ile Giriş Yap" visible. No account actions performed. |
| Language | UI fully Turkish (tr-TR TMDB localization) |
| Stack (observed) | React SPA (Vite build, single `index-*.js`), Tailwind CSS, Swiper.js carousels, Headless UI (mobile menu), Font Awesome 6.2.1 from cdnjs, hosted on Netlify. All data fetching client-side from `api.themoviedb.org` with `api_key` as a query parameter (pattern noted; value intentionally not recorded anywhere in this report). |

Artifacts: `docs/transformation/baseline-screenshots/` (21 PNGs), `home-desktop-trace.json.gz`, `home-mobile-trace.json.gz`, `lighthouse-desktop/`, `lighthouse-mobile/`.

---

## Route inventory (verified live)

| Route | State |
|---|---|
| `/` | Home: hero, Popüler Filmler (Streaming/Kiralık/Sinemada tabs), Trendler (Bugün/Bu Hafta), Ücretsiz İçerikler (Filmler/Diziler), stats strip, footer |
| `/movie` | Popular movies catalog, infinite scroll (loads pages automatically; "Sayfa 2 / 1.001 yüklendi", "Toplam: 20.001") |
| `/movie/:id-:slug` | Movie detail: backdrop+poster, meta, overview, media gallery (Videolar/Posterler/Arka Planlar/Logolar), trailer modal, cast, collection, recommendations, facts, keywords |
| `/movie/:id/cast` | Full cast & crew (linked as "Tümünü Gör" / "Tüm Oyuncular ve Ekip") |
| `/movie/upcoming` | Upcoming movies (footer link) |
| `/tv` | Popular TV catalog |
| `/tv/:id-:slug` | TV detail incl. "Şuanki Sezon" section |
| `/tv/:id/seasons` | Seasons list |
| `/tv/:id/season/:n` | Season detail with episode list, sort (Bölüm/Puan/Yayın Tarihi + asc/desc), stats, guest cast |
| `/person/:id` | Person: bio, known-for, facts, media gallery, filmography |
| `/collection/:id-:slug` | Collection page (linked from movie detail) |
| `/keyword/:id-:slug/movie` | Keyword browsing (linked from movie detail) |
| `/lists` | User lists (requires auth; not exercised) |
| `/search?query=...` | **Redirects to `/`** — no full search results page exists |
| Unknown route | Client-rendered 404 page (**in English**, see issues) |

Mobile drawer adds: Filmler → Popüler / Gösterimdekiler / Yakında; Diziler → Popüler / Günün Programı / Televizyonda; Kişiler → Popüler Kişiler.

---

## Journey findings (desktop 1440 unless noted)

### Home (`home-1440.png`, `home-390.png`, `home-768.png`, `home-1920.png`)
- 3 parallel API calls on load (discover/movie, trending/all/day, movie/popular), all 200, 0 console errors/warnings.
- **Bug — Trendler rail links TV items to `/movie/` routes**: Dexter: Resurrection, Lupin, Ghosts, Dark Matter, MobLand are TV series but link to e.g. `/movie/96677-lupin`. Verified: that URL renders the generic error state "Film detayı yüklenirken bir hata oluştu" (see `error-state-1440.png`). Every trending TV item on home is a dead end.
- Unreleased titles display "0.0" rating (e.g., Avengers: Doomsday) instead of hiding the badge.
- Stats strip "50K+ Filmler / 30K+ Diziler / 1M+ Kullanıcılar" is hardcoded static text ("1M+ Kullanıcılar" is fabricated for this app).
- Duplicate content across rails: Popüler Filmler, Ücretsiz İçerikler(Filmler) and Trendler show largely the same 20 titles (same order), so ~3/4 of the page is the same list three times.
- Cards in rails use `w342` posters; rails are Swiper horizontal scrollers.

### Movies catalog (`movies-1440.png`, `movies-768.png`, `movies-1920.png`)
- Infinite scroll works: 40 cards initially (auto-loads 2 pages), scroll → 97 cards. "∞ Infinite Scroll" label. No pagination controls, no genre/sort filters, no result count control.
- Card accessible names are verbose: title repeated 2–3× plus year and month ("8.5 Kara Şövalye 2008 Kara Şövalye Tem 2008").
- Auto-loading 2 pages on mount doubles initial payload for the catalog.

### Movie detail — The Dark Knight /movie/155 (`movie-detail-1440.png`, `movie-detail-390.png`)
- 7 parallel API calls (detail, keywords, images, videos, credits, collection, recommendations), all 200, console clean.
- Two H1s on the page: movie title + "Kara Şövalye [Seri] koleksiyonunun bir parçası" (heading level bug).
- Media gallery tab labels leak English prefix: "View Videolar", "View Posterler", "View Arka Planlar", "View Logolar".
- Trailer modal: proper `dialog` role, YouTube iframe (autoplay=1), focus moves to Close on open, Escape closes — but focus is not restored to the trigger (falls to `<body>`).
- Gallery posters have generic alt text ("posters image").
- **Recommendations section loads posters at `/original/` size** (also hero backdrop at `/original/`) — massively oversized images for ~150–200px thumbnails.

### Person — Heath Ledger /person/1810 (`person-1440.png`)
- Loads fine: bio, facts, filmography, media gallery.
- Slugification bug visible in generated links: "Kara Şövalye" → `/movie/155-kara-valye`, "Kardeşler" → `lgn-kardeler`, "Dağı" → `da` — Turkish characters (ş, ğ, İ) are dropped/mangled in slugs. Links still resolve (ID-based routing) but URLs are garbage.

### TV (`tv-1440.png`, `tv-detail-1440.png`, `seasons-1440.png`, `season-detail-1440.png`)
- Journey The Simpsons (/tv/456): detail → /seasons → /season/1 all work, console clean.
- Season detail is rich: episode cards with stills, ratings, vote counts, overview, director/writer/guest-cast links, sort dropdown + direction toggle, season stats (episodes, avg runtime, avg score, best episode).
- Data hygiene: some titles contain invisible direction marks ("‎Ofis‎") — no sanitization of TMDB strings.
- Seasons list links exist both as `/tv/456-the-simpsons/seasons` (from detail) and `/tv/456/season/38` (current season card) — inconsistent URL shapes, both work.

### Search (`search-1440.png`, `search-390.png`)
- Trigger: nav "Ara... ⌘ K" button (desktop), floating "Arama" button (mobile), Ctrl/Cmd+K shortcut. Dialog is div-based with combobox role.
- Debounced live suggestions: typing "dun" → "dune" fired exactly 2 `search/multi` requests; results mix Film/Dizi/Kişi with poster, rating, year, type badge.
- "Günün Trendleri" quick picks in the empty state.
- **No full results page**: no "see all results" affordance; Enter navigates to the top result's detail page; `/search?query=dune` redirects to home. Users cannot browse more than ~7 matches, and **no movie/tv/person category filter exists** in the UI despite multi-search supporting it.
- Min-3-char hint shown ("En az 3 karakter girin").

### Error / 404 states (`error-state-1440.png`, `notfound-1440.png`)
- Bogus movie id (`/movie/99999999`) and TV-id-as-movie (`/movie/96677-lupin`) → generic "⚠️ Film detayı yüklenirken bir hata oluşdu / Lütfen daha sonra tekrar deneyin". No retry button, no back-to-home CTA, no distinction between 404 and network failure.
- Unknown route (`/nonexistent-route-xyz`) → dedicated 404 page **entirely in English** ("Oops! Nothing was found... Return to homepage") on an otherwise all-Turkish app.

### Footer / nav links
- Footer: brand, description, Hızlı Erişim (Filmler/Diziler/Kişiler/Yakında), İletişim (GitHub, LinkedIn icons), TMDB text disclaimer, copyright.
- TMDB attribution is **text-only** — no TMDB logo or link to tmdb.org (their terms ask for the logo).
- Social icon links have no accessible names (Lighthouse `link-name` failure, both devices).

---

## Console & network

- **Console: 0 errors and 0 warnings** observed across home, movies, movie detail, tv, tv detail, seasons, season detail, person, search. Clean.
- **All TMDB API calls returned 200/304** during the session. No failed requests to api.themoviedb.org or image CDNs observed.
- `api_key` is present as a query parameter on every client-side request to `api.themoviedb.org` (pattern only; value not recorded). This is a public client key but is exposed in URL logs/history.
- Movie detail fires 7 API requests; home fires 3; season detail fires 4 — parallel, no waterfall. `trending/all/day` served 304 on repeat (cache working).

## Image loading strategy

- `loading="lazy"` on all checked imgs — good.
- **No `srcset`/`sizes` anywhere** — single fixed size per img (w342 cards, w500 gallery, h632 cast, original hero/recommendations).
- **No `width`/`height` attributes** on imgs (CLS is currently saved by aspect-ratio CSS + fast loads, not by intrinsic sizing).
- Recommendation posters and hero backdrops at `/original/` — often 5–10 MB class files for thumbnails; heaviest bandwidth item on detail pages.

---

## Performance (chrome-devtools traces, no throttling — optimistic numbers)

| Metric | Desktop 1440 (`home-desktop-trace.json.gz`) | Mobile-emulated 390x844x2 (`home-mobile-trace.json.gz`) |
|---|---|---|
| LCP | 553 ms (TTFB 317 + render delay 236) | 282 ms (TTFB 91 + render delay 192) |
| CLS | 0.00 | 0.00 |
| INP | not exposed by this trace type; no long interaction jank observed manually | same |

- Trace insights: minor render-blocking requests (CSS bundle + Font Awesome from cdnjs), forced reflows present (Swiper init ~100ms window), third-party main-thread cost negligible (~12 ms). No CrUX field data for the origin.
- Caveat: traces ran unthrottled on a fast connection; real mobile LCP will be materially higher, and the `/original/` image strategy will dominate.
- No layout shift observed on home load at any viewport (skeleton/aspect-ratio placeholders do their job).

## Lighthouse (navigation mode, home)

| Category | Desktop | Mobile |
|---|---|---|
| Accessibility | 90 | 93 |
| Best Practices | 100 | 100 |
| SEO | 92 | 92 |
| Agentic Browsing | 25 | 25 |

Top failing audits (both devices):
1. `link-name` — footer GitHub/LinkedIn icon links have no discernible name.
2. `color-contrast` (desktop only) — "Giriş Yap" button: white on #0891b2 = 3.68:1 (< 4.5:1).
3. `robots-txt` — invalid: 32 errors. **`/robots.txt` actually returns the SPA HTML shell** (no real file).
4. `agent-accessibility-tree`, `llms-txt`, `ard-schema` (agentic-browsing; llms.txt serves HTML shell too).

Reports: `lighthouse-desktop/report.html`, `lighthouse-mobile/report.html`.

## Mobile-specific checks (390x844)

- No horizontal overflow: `scrollWidth` 380 vs `innerWidth` 390 on home and movie detail (off-canvas decorative blur div and rail slides are clipped correctly).
- Mobile drawer (Headless UI disclosure) opens via "Menüyü aç" with full sub-navigation (`mobile-nav-390.png`).
- Floating "Arama" FAB opens the same search dialog with working live suggestions (`search-390.png`).
- Keyboard focus ring (default browser outline) visible on nav links; no skip-to-content link anywhere.

---

## Top 15 problems (ranked by user impact)

1. **Trending TV items on home link to `/movie/` routes and land on an error page** — every TV entry in the Trendler rail is a broken journey for a normal user.
2. **No search results page** — max ~7 suggestions, no category filters (movie/tv/person), Enter jumps to top hit, `/search` redirects home; the core "browse what I found" loop is missing.
3. **`/original/` images for hero backdrops and recommendation posters** — huge bandwidth/memory cost on every detail page, worst on real mobile networks.
4. **SEO infrastructure absent**: no real robots.txt/sitemap.xml/llms.txt (SPA HTML served for all), unknown routes return HTTP 200 (soft 404s), `document.title` never changes per page, no per-route meta/OG per page, no og:image, no canonical.
5. **No responsive images** (`srcset`/`sizes`) — every DPR/viewport gets the same fixed-size file.
6. **Generic detail-error page doubles as 404**: bogus IDs show "yüklenirken bir hata oluştu" with no retry/back CTA and no 404 semantics.
7. **English fragments in Turkish UI**: entire 404 page in English; "View Videolar/Posterler..." gallery tabs; untranslated keyword strings ("sadism", "chaos").
8. **Catalog is discovery-poor**: no filters (genre/year/sort), no pagination alternative, auto-loads 2 pages up front, and home shows the same ~20 titles in 3 different rails.
9. **Accessibility gaps**: unnamed social links, "Giriş Yap" contrast 3.68:1, two H1s on detail pages, no skip link, verbose duplicated card names, generic gallery alts, focus not restored after modal close.
10. **TMDB attribution text-only** (no logo/link) — falls short of TMDB attribution guidelines.
11. **Fabricated stats** ("1M+ Kullanıcılar") presented as real data on home.
12. **"0.0" ratings shown for unreleased titles** instead of suppressing the badge.
13. **Slug mangling for Turkish titles** ("kara-valye", "lgn-kardeler") — ugly share URLs, inconsistent with canonical English slugs elsewhere.
14. **Client-side `api_key` in every request URL** — exposed in logs/history; a proxy/backend key pattern would be safer (and is a prerequisite for any server-rendered redesign).
15. **Data hygiene**: invisible direction marks in titles ("‎Ofis‎"), "Toplam: 20.001" odd total surfaced in UI chrome, mixed name/original-name duplicates inside card accessible names.

## What works well today (worth preserving)

- **Zero console errors/warnings across every page tested**; no failed API or image requests all session.
- Fast, cache-friendly API layer: parallel fetches, 304s on repeat trending calls, debounced search (2 requests for "dune" typing).
- Excellent lab metrics on fast connections (LCP 553ms desktop, CLS 0.00 everywhere) — the aspect-ratio placeholder discipline is working.
- Infinite scroll on catalogs is smooth and correctly batched; Swiper rails are fluid at every viewport.
- Deep route coverage: seasons → episodes with credits, collections, keywords, cast/crew, person filmography — a genuinely complete TMDB surface.
- Solid interaction foundations: real dialog semantics + focus-on-open for trailer and search modals, Escape to close, Ctrl/Cmd+K shortcut, visible default focus rings, lazy-loaded images everywhere.
- Mobile layout is clean: no horizontal overflow, working hamburger drawer with full sub-nav, floating search FAB, usable search dialog.
- Lighthouse Best Practices 100 on both devices; HTTPS, no deprecated APIs flagged.
- Turkish localization is thorough and consistent (except the items listed above).

## Screenshot index

| File | Content |
|---|---|
| home-390/768/1440/1920.png | Home at each viewport (1440 is full-page) |
| movies-1440.png, movies-768.png, movies-1920.png | Movies catalog |
| movie-detail-1440.png (full), movie-detail-390.png | The Dark Knight detail |
| movie-gallery-posters-1440.png | Detail page, poster gallery tab open |
| trailer-modal-1440.png | Trailer modal open (YouTube embed) |
| tv-1440.png, tv-detail-1440.png (full) | TV catalog, The Simpsons detail |
| seasons-1440.png, season-detail-1440.png (full) | Seasons list, Season 1 episodes |
| person-1440.png (full) | Heath Ledger person page |
| search-1440.png, search-390.png | Search dialog with "dune" results |
| mobile-nav-390.png | Mobile drawer menu open |
| keyboard-focus-1440.png | Nav link focused via Tab |
| error-state-1440.png | Detail-load error state (bad ID) |
| notfound-1440.png | English 404 page |
