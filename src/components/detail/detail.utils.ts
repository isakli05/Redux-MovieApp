/**
 * Pure helpers + dossier builders for the shared detail (dossier) pages.
 * Everything here is side-effect free so the certification/trailer/crew
 * extraction logic is unit-testable without an RTK Query store.
 */

import type {
  CastCardModel,
  CrewGroup,
  DetailDossierData,
  FactRow,
  PersonLink,
  SeasonCardModel,
} from './detail.types'
import type { MediaSummary } from '@/types/mediaSummary'
import type { Keyword, MovieDetailFull, TvDetailFull } from '@/types/detailFull'
import type { Cast as MovieCastEntry, Crew as MovieCrewEntry } from '@/types/movieCredits'
import type { Cast as TvCastEntry } from '@/types/tvCredits'
import { languages } from '@/languages-list'

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** "134" → "2s 14dk"; null-safe. */
export const formatRuntime = (minutes: number | null | undefined): string | null => {
  if (!minutes || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return [hours > 0 ? `${hours}s` : null, mins > 0 ? `${mins}dk` : null].filter(Boolean).join(' ')
}

/** "$1,234,567" — whole-dollar, en-US grouping (spec: formatted $). */
export const formatMoney = (usd: number | null | undefined): string | null => {
  if (!usd || usd <= 0) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd)
}

/** English TMDB status → Turkish display copy; unknown statuses pass through. */
export const translateStatus = (status: string | null | undefined): string => {
  if (!status) return ''
  const map: Record<string, string> = {
    Released: 'Vizyonda',
    Rumored: 'Söylenti',
    'In Production': 'Yapım Aşamasında',
    'Post Production': 'Post Prodüksiyon',
    Planned: 'Planlandı',
    Canceled: 'İptal Edildi',
    'Returning Series': 'Devam Ediyor',
    Ended: 'Tamamlandı',
    Pilot: 'Pilot',
  }
  return map[status] ?? status
}

/** Human language name from a BCP-47 code, via the static languages list. */
export const languageName = (code: string | null | undefined): string => {
  if (!code) return ''
  const hit = languages.find((l) => l.iso_639_1 === code || l.code === code)
  return hit?.english_name || code.toUpperCase()
}

/** RTK Query error → is this a TMDB 404 (HTTP 404 or status_code 34)? */
export const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('status' in error)) return false
  const fetchError = error as { status?: unknown; data?: unknown }
  if (fetchError.status === 404) return true
  const data = fetchError.data
  if (data && typeof data === 'object' && 'status_code' in data) {
    return (data as { status_code?: unknown }).status_code === 34
  }
  return false
}

/** Extract the numeric id from a "{id}-{title}" slug, null when malformed. */
export const slugToId = (slug: string | undefined | null): number | null => {
  if (!slug) return null
  const match = /^\d+/.exec(slug)
  return match ? Number(match[0]) : null
}

// ---------------------------------------------------------------------------
// Certification (movie release_dates / tv content_ratings)
// ---------------------------------------------------------------------------

/** Movie certification for a region: region entry first, else first non-empty. */
export const findMovieCertification = (
  releaseDates: MovieDetailFull['release_dates'] | undefined,
  region: string
): string | null => {
  const countries = releaseDates?.results ?? []
  const forRegion = countries.find((c) => c.iso_3166_1 === region)
  const inRegion = forRegion?.release_dates.find((d) => d.certification?.trim())
  if (inRegion?.certification) return inRegion.certification
  const any = countries.flatMap((c) => c.release_dates).find((d) => d.certification?.trim())
  return any?.certification ?? null
}

/** TV certification for a region: region entry first, else first non-empty. */
export const findTvCertification = (
  contentRatings: TvDetailFull['content_ratings'] | undefined,
  region: string
): string | null => {
  const results = contentRatings?.results ?? []
  return results.find((r) => r.iso_3166_1 === region)?.rating
    ?? results.find((r) => r.rating?.trim())?.rating
    ?? null
}

// ---------------------------------------------------------------------------
// Trailer
// ---------------------------------------------------------------------------

/**
 * First official YouTube trailer: type=Trailer + official=true preferred,
 * any YouTube Trailer as fallback. Teasers/other types never qualify —
 * the Fragman button is hidden when this returns null.
 */
export const pickTrailer = (
  videos: { results: { key: string; name: string; site: string; type: string; official: boolean }[] } | undefined
): { key: string; name: string } | null => {
  const results = videos?.results ?? []
  const youTube = results.filter((v) => v.site === 'YouTube' && v.key)
  const officialTrailer = youTube.find((v) => v.type === 'Trailer' && v.official)
  if (officialTrailer) return { key: officialTrailer.key, name: officialTrailer.name }
  const anyTrailer = youTube.find((v) => v.type === 'Trailer')
  return anyTrailer ? { key: anyTrailer.key, name: anyTrailer.name } : null
}

// ---------------------------------------------------------------------------
// Crew extraction
// ---------------------------------------------------------------------------

const toPerson = (entry: { id: number; name: string }): PersonLink => ({ id: entry.id, name: entry.name })

/** Dedupe people by id, preserving first appearance. */
const dedupe = (people: PersonLink[]): PersonLink[] =>
  Array.from(new Map(people.map((p) => [p.id, p])).values())

const top = (people: PersonLink[], limit = 3): PersonLink[] => dedupe(people).slice(0, limit)

const movieCrewGroup = (crew: MovieCrewEntry[], label: string, jobs: string[]): CrewGroup => ({
  label,
  people: top(crew.filter((c) => jobs.includes(c.job)).map(toPerson)),
})

const tvWritingGroup = (crew: { id: number; name: string; department: string }[]): CrewGroup => ({
  label: 'Senaryo',
  people: top(crew.filter((c) => c.department === 'Writing').map(toPerson)),
})

const composerGroup = (crew: MovieCrewEntry[]): CrewGroup =>
  movieCrewGroup(crew, 'Müzik', ['Original Music Composer'])

const compact = (groups: CrewGroup[]): CrewGroup[] => groups.filter((g) => g.people.length > 0)

// ---------------------------------------------------------------------------
// Recommendation normalization
// ---------------------------------------------------------------------------

/**
 * Structural input for resultListToSummaries — accepts both the movie flavor
 * (types/Movies.Result, has media_type + title) and the tv flavor
 * (types/tvs.Result, has name) without coupling to either.
 */
export interface SummaryListResult {
  id: number
  title?: string | null
  name?: string | null
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  release_date?: string | null
  first_air_date?: string | null
}

/** Raw TMDB list results (movie or tv flavor) → MediaSummary for PosterCard. */
export const resultListToSummaries = (
  results: readonly SummaryListResult[] | undefined,
  mediaType: 'movie' | 'tv'
): MediaSummary[] =>
  (results ?? []).map((r) => ({
    id: r.id,
    media_type: mediaType,
    title: r.title || r.name || '',
    poster_path: r.poster_path ?? null,
    backdrop_path: r.backdrop_path ?? null,
    vote_average: typeof r.vote_average === 'number' ? r.vote_average : undefined,
    vote_count: typeof r.vote_count === 'number' ? r.vote_count : undefined,
    release_date: r.release_date || r.first_air_date || null,
  }))

// ---------------------------------------------------------------------------
// Cast normalization
// ---------------------------------------------------------------------------

const movieCastToCard = (entry: MovieCastEntry): CastCardModel => ({
  id: entry.id,
  name: entry.original_name || entry.name,
  character: entry.character || '',
  profilePath: entry.profile_path ?? null,
})

const tvCastToCard = (entry: TvCastEntry): CastCardModel => ({
  id: entry.id,
  name: entry.original_name || entry.name,
  character:
    entry.roles?.map((r) => r.character).filter(Boolean).join(' / ') || entry.character || '',
  profilePath: entry.profile_path ?? null,
  episodeCount: entry.total_episode_count || undefined,
})

// ---------------------------------------------------------------------------
// Dossier builders
// ---------------------------------------------------------------------------

const keywordList = (keywords: Keyword[] | undefined): { id: number; name: string }[] =>
  (keywords ?? []).map((k) => ({ id: k.id, name: k.name }))

/** FactRow factory — empty value → no row at all. */
const fact = (label: string, value: string | null | undefined): FactRow[] =>
  value ? [{ label, value }] : []

const hasMediaContent = (data: MovieDetailFull | TvDetailFull): boolean => {
  const images = data.images
  return (
    (data.videos?.results?.length ?? 0) > 0 ||
    (images?.backdrops?.length ?? 0) > 0 ||
    (images?.posters?.length ?? 0) > 0 ||
    (images?.logos?.length ?? 0) > 0
  )
}

const originalTitleChip = (title: string, original: string | null | undefined): string | null =>
  original && original !== title ? original : null

/** MovieDetailFull → DetailDossierData. Pure; region drives the certification. */
export const buildMovieDossier = (data: MovieDetailFull, region: string): DetailDossierData => {
  const trailer = pickTrailer(data.videos)
  const facts: FactRow[] = [
    ...fact('Durum', translateStatus(data.status)),
    ...fact('Orijinal Dil', languageName(data.original_language)),
    ...fact('Yapım Ülkesi', data.production_countries.map((c) => c.name).join(', ')),
    ...fact('Yapım Şirketleri', data.production_companies.map((c) => c.name).join(', ')),
    ...fact('Bütçe', formatMoney(data.budget)),
    ...fact('Hasılat', formatMoney(data.revenue)),
    ...fact(
      'Çeviriler',
      data.translations?.translations?.length
        ? `${data.translations.translations.length} dil`
        : null
    ),
  ]

  return {
    id: data.id,
    slug: String(data.id),
    mediaType: 'movie',
    title: data.title,
    originalTitle: originalTitleChip(data.title, data.original_title),
    tagline: data.tagline || '',
    overview: data.overview || '',
    posterPath: data.poster_path ?? null,
    backdropPath: data.backdrop_path ?? null,
    voteAverage: data.vote_average,
    metaChips: [
      data.release_date?.slice(0, 4) || null,
      formatRuntime(data.runtime),
      findMovieCertification(data.release_dates, region),
    ].filter((chip): chip is string => Boolean(chip)),
    genres: data.genres.map((g) => ({ id: g.id, name: g.name })),
    crew: compact([
      movieCrewGroup(data.credits?.crew ?? [], 'Yönetmen', ['Director']),
      movieCrewGroup(data.credits?.crew ?? [], 'Senaryo', ['Screenplay', 'Writer', 'Story']),
      composerGroup(data.credits?.crew ?? []),
    ]),
    cast: (data.credits?.cast ?? []).map(movieCastToCard),
    trailerKey: trailer?.key ?? null,
    trailerName: trailer?.name ?? null,
    imdbId: data.external_ids?.imdb_id ?? null,
    keywords: keywordList(data.keywords?.keywords),
    recommendations: resultListToSummaries(data.recommendations?.results, 'movie'),
    hasMedia: hasMediaContent(data),
    facts,
    collection: data.belongs_to_collection?.id
      ? { id: data.belongs_to_collection.id, name: data.belongs_to_collection.name ?? '' }
      : null,
  }
}

/** TvDetailFull → DetailDossierData. Pure; region drives the certification. */
export const buildTvDossier = (data: TvDetailFull, region: string): DetailDossierData => {
  const trailer = pickTrailer(data.videos)
  const spoken = data.spoken_languages?.find((l) => l.iso_639_1 === data.original_language)
  const facts: FactRow[] = [
    ...fact('Durum', translateStatus(data.status)),
    ...fact('Orijinal Dil', spoken?.english_name || languageName(data.original_language)),
    ...fact('Kanal', data.networks.map((n) => n.name).join(', ')),
    ...fact('Yapım Şirketleri', data.production_companies.map((c) => c.name).join(', ')),
    ...fact(
      'Çeviriler',
      data.translations?.translations?.length
        ? `${data.translations.translations.length} dil`
        : null
    ),
  ]

  const seasons: SeasonCardModel[] = (data.seasons ?? [])
    .filter((s) => s.episode_count > 0)
    .map((s) => ({
      seasonNumber: s.season_number,
      name: s.name,
      airDate: s.air_date || null,
      episodeCount: s.episode_count,
      posterPath: s.poster_path ?? null,
    }))

  return {
    id: data.id,
    slug: String(data.id),
    mediaType: 'tv',
    title: data.name,
    originalTitle: originalTitleChip(data.name, data.original_name),
    tagline: data.tagline || '',
    overview: data.overview || '',
    posterPath: data.poster_path ?? null,
    backdropPath: data.backdrop_path ?? null,
    voteAverage: data.vote_average,
    metaChips: [
      data.first_air_date?.slice(0, 4) || null,
      data.number_of_seasons > 0 ? `${data.number_of_seasons} Sezon` : null,
      data.number_of_episodes > 0 ? `${data.number_of_episodes} Bölüm` : null,
      findTvCertification(data.content_ratings, region),
    ].filter((chip): chip is string => Boolean(chip)),
    genres: data.genres.map((g) => ({ id: g.id, name: g.name })),
    crew: compact([
      { label: 'Yaratıcı', people: top((data.created_by ?? []).map(toPerson)) },
      tvWritingGroup(data.credits?.crew ?? []),
      composerGroup(data.credits?.crew ?? []),
    ]),
    cast: (data.credits?.cast ?? []).map(tvCastToCard),
    trailerKey: trailer?.key ?? null,
    trailerName: trailer?.name ?? null,
    imdbId: data.external_ids?.imdb_id ?? null,
    keywords: keywordList(data.keywords?.results),
    recommendations: resultListToSummaries(data.recommendations?.results, 'tv'),
    hasMedia: hasMediaContent(data),
    facts,
    seasons,
    collection: null,
  }
}
