/**
 * Person credits domain helpers (Cinematic Atlas §6 Person).
 *
 * Normalizes TMDB `movie_credits` / `tv_credits` (appended to person details)
 * into a single `UnifiedCredit` shape so Filmler/Diziler tabs, the "En Bilinen
 * İşler" rail and the sort controls all share one code path.
 *
 * NOTE: TMDB does not localize person names, characters or jobs — UI labels
 * are Turkish, values stay in their original language (documented limitation).
 */

import type { MediaSummary } from '@/types/mediaSummary'
import type { MovieCredit, PersonDetail, TvCredit } from '@/types/personDetail'

/** `append_to_response=external_ids` payload (not in the legacy PersonDetail type). */
export interface PersonExternalIds {
  id?: number
  imdb_id?: string | null
  facebook_id?: string | null
  instagram_id?: string | null
  twitter_id?: string | null
  tiktok_id?: string | null
  youtube_id?: string | null
  wikidata_id?: string | null
  freebase_id?: string | null
  freebase_mid?: string | null
}

/**
 * Person details as actually returned by `getPersonDetails`
 * (append_to_response adds `external_ids` at runtime).
 */
export type PersonDetailFull = PersonDetail & {
  external_ids?: PersonExternalIds | null
}

/** Crew entries carry `job`/`department`; the legacy cast types omit them. */
export type MovieCrewCredit = MovieCredit & { job?: string; department?: string }
export type TvCrewCredit = TvCredit & { job?: string; department?: string }

export type CreditKind = 'movie' | 'tv'

export interface UnifiedCredit {
  /** TMDB credit_id — stable per role, unique within cast/crew lists. */
  key: string
  id: number
  kind: CreditKind
  title: string
  posterPath: string | null
  /** release_date | first_air_date ('' when unknown). */
  date: string
  year: string
  popularity: number
  voteAverage?: number
  character?: string
  /** TV cast only. */
  episodeCount?: number
  /** Crew only. */
  job?: string
  department?: string
  isCast: boolean
}

export type CreditSortMode = 'year-desc' | 'year-asc' | 'popularity'

const yearOf = (date?: string | null): string => {
  if (!date || !/^\d{4}/.test(date)) return ''
  return date.slice(0, 4)
}

/** Structural subset shared by movie/tv cast & crew entries. */
interface RawCreditFields {
  credit_id: string
  id: number
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
  popularity?: number
  vote_average?: number
  character?: string
  episode_count?: number
  job?: string
  department?: string
}

const toCreditBase = (
  credit: RawCreditFields,
  kind: CreditKind,
  isCast: boolean,
): UnifiedCredit => {
  const date = kind === 'movie' ? credit.release_date : credit.first_air_date
  return {
    key: credit.credit_id,
    id: credit.id,
    kind,
    title: kind === 'movie' ? credit.title ?? '' : credit.name ?? '',
    posterPath: credit.poster_path ?? null,
    date: date ?? '',
    year: yearOf(date),
    popularity: typeof credit.popularity === 'number' ? credit.popularity : 0,
    voteAverage: typeof credit.vote_average === 'number' ? credit.vote_average : undefined,
    character: credit.character || undefined,
    episodeCount: credit.episode_count,
    job: credit.job,
    department: credit.department,
    isCast,
  }
}

export const unifyMovieCredits = (
  cast?: MovieCredit[],
  crew?: MovieCrewCredit[],
): UnifiedCredit[] => [
  ...(cast ?? []).map((c) => toCreditBase(c, 'movie', true)),
  ...(crew ?? []).map((c) => toCreditBase(c, 'movie', false)),
]

export const unifyTvCredits = (
  cast?: TvCredit[],
  crew?: TvCrewCredit[],
): UnifiedCredit[] => [
  ...(cast ?? []).map((c) => toCreditBase(c, 'tv', true)),
  ...(crew ?? []).map((c) => toCreditBase(c, 'tv', false)),
]

/** Sorts a copy; credits without a year always sink in year modes. */
export function sortCredits(credits: UnifiedCredit[], mode: CreditSortMode): UnifiedCredit[] {
  const sorted = [...credits]
  if (mode === 'popularity') {
    sorted.sort((a, b) => b.popularity - a.popularity)
    return sorted
  }
  const dir = mode === 'year-desc' ? -1 : 1
  sorted.sort((a, b) => {
    if (!a.year && !b.year) return b.popularity - a.popularity
    if (!a.year) return 1
    if (!b.year) return -1
    return a.year === b.year ? b.popularity - a.popularity : a.year < b.year ? -dir : dir
  })
  return sorted
}

/**
 * "En Bilinen İşler": popularity-ordered, de-duplicated cross-media works
 * (the person detail response has no `known_for` array, so it is derived).
 */
export function mostKnownCredits(
  person: PersonDetail,
  limit = 12,
): (MediaSummary & { media_type: 'movie' | 'tv' })[] {
  const movie = person.movie_credits
  const tv = person.tv_credits
  if (!movie && !tv) return []

  const byId = new Map<number, UnifiedCredit>()
  for (const credit of [
    ...unifyMovieCredits(movie?.cast, movie?.crew),
    ...unifyTvCredits(tv?.cast, tv?.crew),
  ]) {
    if (credit.popularity <= 0 && !credit.posterPath) continue
    const existing = byId.get(credit.id)
    if (!existing || credit.popularity > existing.popularity) byId.set(credit.id, credit)
  }

  return [...byId.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      media_type: c.kind,
      title: c.title,
      poster_path: c.posterPath,
      vote_average: c.voteAverage,
      vote_count: undefined,
      release_date: c.date || null,
      popularity: c.popularity,
    }))
}

/** Whole years elapsed between birthday and deathday (or today). Null when unknown. */
export function calcAge(birthday?: string | null, deathday?: string | null): number | null {
  if (!birthday) return null
  const birth = new Date(birthday)
  if (Number.isNaN(birth.getTime())) return null
  const end = deathday ? new Date(deathday) : new Date()
  if (Number.isNaN(end.getTime())) return null
  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

const DEPARTMENT_LABELS: Record<string, string> = {
  Acting: 'Oyunculuk',
  Directing: 'Yönetmenlik',
  Writing: 'Yazarlık',
  Production: 'Yapımcılık',
  Sound: 'Ses',
  Camera: 'Görüntü',
  Editing: 'Kurgu',
  Art: 'Sanat Yönetimi',
  'Costume & Make-Up': 'Kostüm & Makyaj',
  Crew: 'Ekip',
  Creator: 'Yaratıcı',
  Actors: 'Oyunculuk',
  Lighting: 'Işık',
  'Visual Effects': 'Görsel Efektler',
}

export const departmentLabel = (department?: string | null): string =>
  (department && DEPARTMENT_LABELS[department]) || department || '—'

const JOB_LABELS: Record<string, string> = {
  Director: 'Yönetmen',
  Screenplay: 'Senaryo',
  Writer: 'Yazar',
  Story: 'Öykü',
  Novel: 'Roman',
  Characters: 'Karakterler',
  Producer: 'Yapımcı',
  'Executive Producer': 'Uygulayıcı Yapımcı',
  'Co-Producer': 'Ortak Yapımcı',
  'Line Producer': 'Yapım Sorumlusu',
  Editor: 'Kurgu',
  'Director of Photography': 'Görüntü Yönetmeni',
  'Original Music Composer': 'Müzik',
  Composer: 'Müzik',
  'Casting Director': 'Oyuncu Seçimi',
  Casting: 'Oyuncu Seçimi',
  'Production Design': 'Prodüksiyon Tasarımı',
  'Art Direction': 'Sanat Yönetimi',
  'Costume Design': 'Kostüm Tasarımı',
  'Makeup Artist': 'Makyaj',
  'Special Effects': 'Özel Efektler',
  'Visual Effects Supervisor': 'Görsel Efekt Süpervizörü',
  'Sound Designer': 'Ses Tasarımcısı',
  'Sound Editor': 'Ses Kurgu',
  Screenwriter: 'Senarist',
  'Creative Director': 'Yaratıcı Yönetmen',
}

/** Common crew jobs are localized; unknown jobs pass through untranslated. */
export const jobLabel = (job?: string | null): string => (job && JOB_LABELS[job]) || job || ''

export interface PersonExternalLink {
  key: string
  label: string
  href: string
}

/** Official profile links from `external_ids` (+ homepage, + TMDB itself). */
export function buildExternalLinks(person: PersonDetailFull): PersonExternalLink[] {
  const links: PersonExternalLink[] = []
  const ids = person.external_ids ?? null

  if (person.homepage) links.push({ key: 'homepage', label: 'Resmi Site', href: person.homepage })
  if (ids?.imdb_id) links.push({ key: 'imdb', label: 'IMDb', href: `https://www.imdb.com/name/${ids.imdb_id}` })
  if (ids?.instagram_id)
    links.push({ key: 'instagram', label: 'Instagram', href: `https://www.instagram.com/${ids.instagram_id}` })
  if (ids?.twitter_id) links.push({ key: 'twitter', label: 'X (Twitter)', href: `https://twitter.com/${ids.twitter_id}` })
  if (ids?.facebook_id)
    links.push({ key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/${ids.facebook_id}` })
  if (ids?.tiktok_id) links.push({ key: 'tiktok', label: 'TikTok', href: `https://www.tiktok.com/@${ids.tiktok_id}` })
  links.push({
    key: 'tmdb',
    label: 'TMDB',
    href: `https://www.themoviedb.org/person/${person.id}`,
  })
  return links
}
