# Design Direction — "Cinematic Atlas"

Dark-first cinematic editorial system. Decided (D2) after weighing three internal concepts:
(A) Cinematic Atlas — layered blacks + marquee gold + editorial serif → **selected** (distinctive, feasible, accessible);
(B) "Projection Room" — projector-beam gradients + film-grain overlays → rejected (heavy effects, a11y/perf risk, dated neon feel);
(C) "Archive Index" — stark typographic museum catalog, tiny thumbnails → rejected (distinctive but poor imagery-first discovery UX).

Product name stays **LMDB**. Turkish UI language throughout (fix English fragments).

## 1. Color tokens (dark theme = default; light mode intentionally not built)

Tailwind theme extension, CSS variables on `:root` for runtime theming:

```
surface-void    #0A0A0F   page background (near-black, blue-violet undertone)
surface-base    #101018    cards alternate, rails
surface-raised  #16161F    raised cards, popovers
surface-overlay #1C1C28    active states, chips
surface-glass   rgba(16,16,24,0.72)  glass bars (backdrop-blur, restrained use: navbar, media controls)
text-primary    #F5F3EE    warm off-white (NEVER #fff)
text-secondary  #A8A59C
text-muted      #6E6B64
accent          #E8B54D    marquee gold (primary interactive)
accent-hover    #F5C866
accent-ink      #1A1407    text on accent
success         #4ADE80 → use desaturated #6EE7A0 for text
danger          #F87171
line            rgba(245,243,238,0.08)   hairline borders
line-strong     rgba(245,243,238,0.16)
scrim           linear-gradient overlays over imagery: to top `rgba(10,10,15,0.98)→transparent`, plus left gradient on wide layouts
```

- Rating color = accent gold. NO cyan/blue/purple defaults anywhere (delete slate/blue/purple usage).
- Never place body text below 4.5:1 on its surface (verify `text-secondary` ≥ 4.5 on raised surfaces; `text-muted` reserved for ≥3:1 large/decorative only).
- Content-derived accent: optional per-detail-page subtle backdrop tint sampled from poster (CSS `image-set`/overlay at ≤ 12% opacity) — progressive, never required for usability.

## 2. Typography

Self-hosted via @fontsource (latin-ext REQUIRED for Turkish ğşİı):

- **Display: Fraunces variable** (`@fontsource-variable/fraunces`, opsz axis) — page titles, section headers, hero title, big numbers. Weight 550–650, slight negative tracking on large sizes.
- **Body/UI: Inter variable** (`@fontsource-variable/inter`).

Scale (fluid where noted): `display-xl` clamp(2.5rem→4.25rem)/1.05 · `display-lg` clamp(2rem→3rem)/1.1 · `display-md` 1.5rem/1.2 · `title-md` 1.125rem semibold · `body-md` 1rem/1.6 · `body-sm` 0.875rem/1.5 · `caption` 0.75rem uppercase, letter-spacing 0.08em, text-secondary.
Ratings/metadata numerals: `font-variant-numeric: tabular-nums`.

## 3. Space, surface, shape

- Spacing 4px grid. Section rhythm: `py-16 md:py-20` desktop, `py-10` mobile. Container `max-w-[1440px]`, gutters `px-4 sm:px-6 lg:px-8`.
- Radius: `rounded-md 8px` chips/inputs · `rounded-lg 12px` cards · `rounded-xl 16px` modals/hero panels. Posters keep `rounded-lg` with 1px `line` border + inner padding? No — flush edge, border only on hover.
- Elevation: `shadow-cine: 0 24px 48px -24px rgb(0 0 0 / 0.8)` for floating panels only. Cards use borders, not shadows.
- Glass: ONLY navbar (scrolled state) and media/lightbox controls. Max blur 16px. Never on large surfaces.

## 4. Motion language

Transform/opacity only. Durations: 150ms micro, 250ms standard, 400ms hero. Easing `cubic-bezier(0.22,1,0.36,1)`.
- Poster hover (pointer devices): scale 1.03 + translateY(-4px), gold border fade-in, meta slide-up, 250ms.
- Rails: scroll-snap; chevron buttons fade edges. Keyboard: cards focusable, Enter activates.
- Content reveal on scroll: IntersectionObserver, opacity 0→1 + translateY(12px)→0, 400ms, stagger 40ms (max 8 items).
- Page transitions: 200ms crossfade (router view transitions if trivial, else none — don't force it).
- Hero: crossfade between featured items (600ms), progress dots, auto-advance 7s paused on hover/focus/reduced-motion.
- `@media (prefers-reduced-motion: reduce)`: all durations → 0.01ms, auto-advance off, scroll-snap retained.

## 5. Component contracts (`src/components/ui/`)

| Component | Contract |
|---|---|
| `PosterCard` | props: item (media union), size sm|md|lg, showRating, showMediaType. Link `/movie/:id` or `/tv/:id` from `media_type`. Poster `w-[2:3]`, sized TMDB URL + `srcset` (w342/w500), eager only if above-fold. Fallback: surface-raised tile + initial letter + title. RatingBadge corner (hide if `!vote_average`). Title 1-line ellipsis + year. Skeleton variant identical shape. |
| `MediaRail` | SectionHeader + horizontal scroll-snap list, chevrons (hidden < md), edge fades, `role="list"`. No Swiper. |
| `SectionHeader` | eyebrow (caption, gold) + display title (Fraunces) + optional "Tümü" ghost link with arrow. |
| `RatingBadge` | score ring (SVG circle, gold) with tabular number; `aria-label="IMDb puanı X"` — actually TMDB: `"TMDB puanı 10 üzerinden X"`. |
| `BackdropHero` | full-bleed image (w1280/srcset, eager, fetchpriority high), bottom scrim + left scrim (wide), slot for content; min-h 62vh mobile / 72vh desktop; empty/failure → surface-void + subtle radial texture (inline SVG, no asset). |
| `Button` | variants: primary (gold bg, ink text), ghost (text-secondary hover text-primary), outline (line-strong border). Sizes sm/md/lg. Loading state (spinner). |
| `Chip` | filter/genre pill, surface-overlay bg, active = gold border + gold text. |
| `Skeleton` | poster/card/line/section variants, shimmer 1.2s (reduced-motion: static). |
| `EmptyState` | icon slot + title + hint + optional action. |
| `ErrorState` | message + retry Button + back link. Replaces infinite spinners (fix P). |
| `Tabs` | underline style, gold active indicator, keyboard arrow nav, `role="tablist"`. |

## 6. Page blueprints

**Home**: BackdropHero (trending/day top 3, crossfade; title in Fraunces, meta chips, Detaylar primary + Fragman outline buttons) → "Bugün Trend" rail → "Vizyonda" (now_playing, editorial band with backdrop cards) → "Yakında" rail → "Eleştirmenlerin Seçtikleri" (top_rated-like: discover vote_count.gte=1000 sort vote_average.desc) → "Gizli Cevherler" (discover vote_average.gte=7.5, vote_count 300–1500, sort popularity.asc, labeled criteria in UI) → "Ücretsiz İzle" (discover free + watch_region; JustWatch note) → "Son Baktıklarınız" (real localStorage recents, hidden when empty — no fake stats, fixes T). Hero ≤ 72vh; never stack two heroes.

**Movie/TV detail (dossier)**: BackdropHero with poster card overlap, display title + original title, meta chips (year, runtime/seasons, certification from release_dates/content_ratings, genres), RatingBadge, overview (expandable), director/creator row, JustWatch-attributed provider logos (region-aware), tabs: Kadro / Fragmanlar & Galeri / Öneriler / Detaylar (keywords, production, external links). Works with missing artwork/trailers (empty-tab hidden). TV adds season navigator strip.

**Seasons/Episodes**: preserve existing advanced logic (filters, stats, enhanced cards) — restyle only; fix P ordering; lazy-load per-season media on demand (fix V).

**Search**: SearchBar stays (debounce, Cmd+K, trending) restyled; full `/search` results page: category tabs (Tümü/Film/Dizi/Kişi), real `total_results` counts (fix L), SmartPagination revived (fix K), empty state with suggestions.

**Discover**: URL-stateful filters (genre, year range, min rating, sort, language, type; watch provider + region when supported), shareable URLs, grid with hybrid loading.

**Person**: profile hero (backdrop from known_for), bio (expandable, TR/EN fallback), credits grouped Film/Dizi with year sort and role highlight.

**Lists**: dark restyle; list detail route `/lists/:id` with add/remove (wire existing mutations, fix J), create modal dark. Auth-aware UI states.

**Shell**: glass navbar on scroll, logo wordmark, links: Keşfet/Filmler/Diziler/İnsanlar + search trigger (⌘K) + auth menu; mobile drawer with focus trap; Footer: TMDB attribution logo + statement + JustWatch (D7), sitemap links, no fake stats.

## 7. Non-goals

No Netflix-clone red, no neon gradients, no video autoplay, no canvas effects, no light mode, no decorative non-functional controls.
