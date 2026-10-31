# TMDB API Capability Matrix (verified 2026-10-31 against developer.themoviedb.org)

Strategy (D1): **v3 = authoritative catalog API** (no deprecation announced; v5 does not exist). **v4 = thin user layer only** (auth, 9 account reads, list read/write) — not adopted (D1). Host `https://api.themoviedb.org`; images `https://image.tmdb.org/t/p/{size}{path}`.

## Auth models

| Model | Transport | Unlocks | Notes |
|---|---|---|---|
| v3 API key (app) | `api_key` query param | all v3 reads | public-embeddable by design; same access as Bearer |
| v3 read access token (app) | `Authorization: Bearer` | same as api_key | works across v3+v4 |
| v3 `session_id` (user) | query param | ratings, favorites, watchlist, v3 lists | request token 60 min; our chosen user model |
| v4 user access token | Bearer JWT | v4 account/list endpoints | 15-min request token; **no documented refresh** → rejected |
| Guest session | `guest_session_id` | ratings only | expires after 60 min idle; not used |

## Key capabilities (v3 unless noted)

- **Trending**: `/3/trending/{all|movie|tv|person}/{day|week}` — `/all` items carry `media_type` (branch on it).
- **Discover movie/tv**: `with_genres` (`,`=AND `\|`=OR), `primary_release_year` / `first_air_date_year`, date ranges, `vote_average.gte/lte` + `vote_count.gte/lte` (pair them for credible sorting), `with_runtime`, `with_original_language`, `with_origin_country`, `with_people`, `with_keywords`, certification filters, `region`. Watch trio **must be used together**: `watch_region` + `with_watch_providers` + `with_watch_monetization_types` (`flatrate|free|ads|rent|buy`). `sort_by`: popularity/vote_average/vote_count/release date/title (+`.asc/.desc`).
- **Free content (fix H)**: `discover/{movie,tv}?watch_region={ISO}&with_watch_monetization_types=free`. `/movie/popular` has NO free filter.
- **Watch providers**: `/3/{movie,tv}/{id}/watch/providers` → `results[country]` = `{link, flatrate|rent|buy|ads|free[]}`; master lists `/3/watch/providers/{movie,tv}`, regions `/3/watch/providers/regions`. **JustWatch attribution mandatory** wherever shown. `watch_region` has NO API default (fix I: client must send it).
- **Detail + `append_to_response`** (max 20): credits, videos, images (`include_image_language=tr,en,null` — `language` alone hides untagged images), recommendations, similar, release_dates (movie), watch/providers, external_ids, keywords, translations, alternative_titles. TV: `aggregate_credits` (full-series, `episode_count`), `content_ratings` (no TV release-dates endpoint).
- **Season/episode**: `/3/tv/{id}/season/{n}` (episodes with `guest_stars`, `crew`), episode detail endpoint; both support appends.
- **Person**: details, `combined_credits` (per-item `media_type`), images, external_ids. Names/characters not translated (TR gap).
- **Search**: `/3/search/{multi|movie|tv|person}` — `page/total_pages/total_results`; multi returns `media_type`.
- **Lists v3** (our model): `POST /3/list` (create), `/3/list/{id}/add_item|remove_item` (single `media_id`, **movies only**), `/3/list/{id}/clear?confirm=true`, item_status, details (paginated `page`). v4 lists (bulk add, mixed movie/TV) deferred — see D1.
- **Account v3**: `/3/account/{id}` details; `POST .../favorite|watchlist` (`media_type` movie|tv); `GET .../favorite/movies|tv`, `.../watchlist/movies|tv`, `.../rated/movies|tv|episodes` (sort_by `created_at.asc|desc` only); `/3/account/{id}/lists` (note: NOT `/account/lists` — fix D).
- **Ratings**: `POST/DELETE /3/{movie,tv}/{id}/rating`, `.../tv/{id}/season/{s}/episode/{e}/rating`; body `{"value":0.5–10}`; JSON charset header required. **Rating removes item from watchlist by default** (TMDB account setting).
- **Images**: sizes from `/3/configuration`; posters/backdrops/stills/profiles/logos; logos `.png` (SVG at `original` only).

## Operational rules

- Rate limits: ~40 req/s soft, enforced via **429** — honor with backoff; no fixed quota.
- Attribution: TMDB logo + "This product uses the TMDB API but is not endorsed or certified by TMDB" (About/footer, linking themoviedb.org) + JustWatch for provider data (D7).
- 401/403 → session invalid (revalidate via `/api/auth/session`); 404 → typed not-found UI; 429 → backoff; never auto-retry mutations.
- `region` (release dates) ≠ `watch_region` (providers) — do not conflate.
