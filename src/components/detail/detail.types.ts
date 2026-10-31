/**
 * Normalized "dossier" model shared by the movie and TV detail pages
 * (DESIGN_DIRECTION.md §6 "Movie/TV detail (dossier)"). Both pages map their
 * `*DetailFull` append response into this shape via detail.utils builders,
 * then render a single DetailDossier — no per-media JSX forks.
 */

import type { MediaSummary } from '@/types/mediaSummary'

/** Linked person reference (crew rows). */
export interface PersonLink {
  id: number
  name: string
}

/** One labeled crew group ("Yönetmen", "Senaryo", "Müzik"…). */
export interface CrewGroup {
  label: string
  people: PersonLink[]
}

/** Normalized cast card entry for rails and cast pages. */
export interface CastCardModel {
  id: number
  name: string
  /** Character(s) played — TV roles joined with " / ". May be empty. */
  character: string
  profilePath: string | null
  /** TV aggregate-style episode count, when known. */
  episodeCount?: number
}

/** Normalized season entry for the TV seasons navigator strip. */
export interface SeasonCardModel {
  seasonNumber: number
  name: string
  airDate: string | null
  episodeCount: number
  posterPath: string | null
}

/** Key/value row for the "Detaylar" tab. */
export interface FactRow {
  label: string
  value: string
}

/** Fully normalized dossier input for DetailDossier. */
export interface DetailDossierData {
  id: number
  /** Raw route slug ("603-the-matrix") used to build in-app links. */
  slug: string
  mediaType: 'movie' | 'tv'
  title: string
  /** Original title — null when identical to `title`. */
  originalTitle: string | null
  tagline: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  /** TMDB 0–10 score; RatingBadge hides itself when 0/invalid. */
  voteAverage: number
  /** Pre-formatted chips: year, runtime or season/episode count, certification. */
  metaChips: string[]
  genres: { id: number; name: string }[]
  crew: CrewGroup[]
  cast: CastCardModel[]
  /** First official YouTube trailer key; null → Fragman button hidden. */
  trailerKey: string | null
  /** Full trailer title for the modal label. */
  trailerName: string | null
  imdbId: string | null
  keywords: { id: number; name: string }[]
  recommendations: MediaSummary[]
  /** true when the Medya tab has any video/image to show (tab hidden otherwise). */
  hasMedia: boolean
  facts: FactRow[]
  /** TV only — empty/undefined hides the seasons strip. */
  seasons?: SeasonCardModel[]
  /** Movie only — belongs_to_collection reference, renders the collection band. */
  collection?: { id: number; name: string } | null
}
