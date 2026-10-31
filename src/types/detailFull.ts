/**
 * Append-to-response detail types (D-series detail appends, fixes E/G boundary).
 * TMDB allows max 20 appends per detail request; both Full shapes below use 10:
 * credits, videos, images, recommendations, similar, release_dates|content_ratings,
 * watch/providers, external_ids, keywords, translations.
 */

import type { MovieDetails } from './movieDetails';
import type { TvDetails } from './tvsDetails';
import type { MovieCredits } from './movieCredits';
import type { TvCredits } from './tvCredits';
import type { VideosResponse } from './videos';
import type { ImagesResponse } from './media';
import type { Movies } from './Movies';
import type { Tvs } from './tvs';

// ---------------------------------------------------------------------------
// Shared appended sections
// ---------------------------------------------------------------------------

/** `/movie/{id}/release_dates` — per-country certifications. */
export interface ReleaseDateEntry {
  certification: string;
  iso_639_1: string | null;
  note?: string;
  release_date: string;
  type: number;
}

export interface ReleaseDateCountry {
  iso_3166_1: string;
  release_dates: ReleaseDateEntry[];
}

export interface ReleaseDatesResponse {
  id: number;
  results: ReleaseDateCountry[];
}

/** `/tv/{id}/content_ratings` — TV has no release_dates equivalent. */
export interface ContentRatingCountry {
  iso_3166_1: string;
  rating: string;
}

export interface ContentRatingsResponse {
  id: number;
  results: ContentRatingCountry[];
}

/** `external_ids` append (movie + tv superset; absent fields stay undefined). */
export interface ExternalIdsResponse {
  id: number;
  imdb_id: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  tiktok_id?: string | null;
  youtube_id?: string | null;
  wikidata_id?: string | null;
  tvdb_id?: number | null;
}

/** `keywords` append — movie nests under `keywords`, tv under `results`. */
export interface Keyword {
  id: number;
  name: string;
}

export interface MovieKeywordsResponse {
  id: number;
  keywords: Keyword[];
}

export interface TvKeywordsResponse {
  id: number;
  results: Keyword[];
}

export interface TranslationData {
  homepage?: string;
  overview?: string;
  runtime?: number | null;
  tagline?: string;
  title?: string;
  name?: string;
}

export interface Translation {
  iso_3166_1: string;
  iso_639_1: string;
  name: string;
  english_name: string;
  data: TranslationData;
}

export interface TranslationsResponse {
  id: number;
  translations: Translation[];
}

// ---------------------------------------------------------------------------
// Watch providers (raw shapes; normalized shapes live in providers.endpoints)
// ---------------------------------------------------------------------------

/** Raw JustWatch-sourced provider entry (attribution mandatory — D7). */
export interface WatchProviderEntry {
  provider_id: number;
  provider_name: string;
  display_priority: number;
  logo_path: string | null;
}

/** Raw per-country provider block as returned inside `results[country]`. */
export interface RawRegionProviders {
  link?: string;
  flatrate?: WatchProviderEntry[];
  rent?: WatchProviderEntry[];
  buy?: WatchProviderEntry[];
  ads?: WatchProviderEntry[];
  free?: WatchProviderEntry[];
}

/** Raw `/watch/providers` append body. */
export interface RawWatchProvidersResponse {
  id: number;
  results: Record<string, RawRegionProviders>;
}

// ---------------------------------------------------------------------------
// Full detail responses
// ---------------------------------------------------------------------------

/** `GET /movie/{id}?append_to_response=…` (10 appends, see file header). */
export interface MovieDetailFull extends MovieDetails {
  credits: MovieCredits;
  videos: VideosResponse;
  images: ImagesResponse;
  recommendations: Movies;
  similar: Movies;
  release_dates: ReleaseDatesResponse;
  'watch/providers': RawWatchProvidersResponse;
  external_ids: ExternalIdsResponse;
  keywords: MovieKeywordsResponse;
  translations: TranslationsResponse;
}

/** `GET /tv/{id}?append_to_response=…` (10 appends, see file header). */
export interface TvDetailFull extends TvDetails {
  credits: TvCredits;
  videos: VideosResponse;
  images: ImagesResponse;
  recommendations: Tvs;
  similar: Tvs;
  content_ratings: ContentRatingsResponse;
  'watch/providers': RawWatchProvidersResponse;
  external_ids: ExternalIdsResponse;
  keywords: TvKeywordsResponse;
  translations: TranslationsResponse;
}
