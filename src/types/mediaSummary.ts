/**
 * Shared discovery media contract between the API layer and the UI.
 * Decided in D5 (docs/transformation/STATUS.md): a discriminated model on
 * `media_type` fixes the mixed-trending defects (E/F/G) at the boundary.
 * NOTE: distinct from src/types/media.ts which serves MediaGallery imagery.
 */

export type DiscoveryMediaType = 'movie' | 'tv' | 'person'

/**
 * Normalized summary item used by PosterCard, MediaRail, search results,
 * recommendations, watchlists and lists. The API layer maps raw TMDB shapes
 * (movie/tv/person list results, trending/all items) into this type.
 */
export interface MediaSummary {
  id: number
  media_type: DiscoveryMediaType
  /** movie.title | tv.name | person.name */
  title: string
  /** movie.poster_path | tv.poster_path | person.profile_path */
  poster_path: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  /** movie.release_date | tv.first_air_date | null */
  release_date?: string | null
  overview?: string
  popularity?: number
  /** person items */
  known_for_department?: string
}

/** Raw list item shapes as returned by TMDB before normalization. */
export interface TrendingRawItem {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path?: string | null
  backdrop_path?: string | null
  profile_path?: string | null
  vote_average?: number
  vote_count?: number
  release_date?: string
  first_air_date?: string
  overview?: string
  popularity?: number
  known_for_department?: string
}

/** Map any raw TMDB list item into MediaSummary; never throws on missing fields. */
export function toMediaSummary(item: TrendingRawItem): MediaSummary {
  return {
    id: item.id,
    media_type: item.media_type,
    title: item.title ?? item.name ?? '',
    poster_path: item.poster_path ?? item.profile_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : undefined,
    vote_count: typeof item.vote_count === 'number' ? item.vote_count : undefined,
    release_date: item.release_date ?? item.first_air_date ?? null,
    overview: item.overview,
    popularity: item.popularity,
    known_for_department: item.known_for_department
  }
}
