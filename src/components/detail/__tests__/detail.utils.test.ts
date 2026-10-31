import { describe, expect, it } from 'vitest'
import type { MovieDetailFull, TvDetailFull } from '@/types/detailFull'
import {
  buildMovieDossier,
  buildTvDossier,
  findMovieCertification,
  findTvCertification,
  formatMoney,
  formatRuntime,
  isNotFoundError,
  pickTrailer,
  resultListToSummaries,
  slugToId,
  translateStatus,
} from '../detail.utils'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const releaseDates = (regions: { code: string; certs: string[] }[]) => ({
  id: 1,
  results: regions.map((r) => ({
    iso_3166_1: r.code,
    release_dates: r.certs.map((cert, i) => ({
      certification: cert,
      iso_639_1: null,
      release_date: `2020-01-0${i + 1}`,
      type: 3,
    })),
  })),
})

const crewEntry = (id: number, name: string, job: string) => ({
  adult: false,
  gender: 2,
  id,
  known_for_department: 'Directing',
  name,
  original_name: name,
  popularity: 1,
  profile_path: `/p${id}.jpg`,
  credit_id: `c${id}`,
  department: 'Directing',
  job,
})

const castEntry = (id: number, name: string, character: string) => ({
  adult: false,
  gender: 1,
  id,
  known_for_department: 'Acting',
  name,
  original_name: name,
  popularity: 1,
  profile_path: `/p${id}.jpg`,
  cast_id: id,
  character,
  credit_id: `c${id}`,
  order: id,
})

function movieFull(overrides: Partial<MovieDetailFull> = {}): MovieDetailFull {
  return {
    adult: false,
    backdrop_path: '/backdrop.jpg',
    belongs_to_collection: undefined,
    budget: 0,
    genres: [{ id: 28, name: 'Aksiyon' }],
    homepage: '',
    id: 603,
    imdb_id: 'tt0133093',
    original_language: 'en',
    original_title: 'The Matrix',
    overview: 'Bilgisayar hacker gerçekliği keşfeder.',
    popularity: 50,
    poster_path: '/poster.jpg',
    production_companies: [],
    production_countries: [{ iso_3166_1: 'US', name: 'Amerika Birleşik Devletleri' }],
    release_date: '1999-03-31',
    revenue: 0,
    runtime: 136,
    spoken_languages: [{ iso_639_1: 'en', name: 'English' }],
    status: 'Released',
    tagline: 'Welcome to the Real World',
    title: 'The Matrix',
    video: false,
    vote_average: 8.2,
    vote_count: 24000,
    credits: {
      id: 603,
      cast: [castEntry(1, 'Keanu Reeves', 'Neo'), castEntry(2, 'Laurence Fishburne', 'Morpheus')],
      crew: [
        crewEntry(10, 'Lana Wachowski', 'Director'),
        crewEntry(11, 'Lilly Wachowski', 'Director'),
        crewEntry(12, 'The Wachowskis', 'Screenplay'),
        crewEntry(13, 'Don Davis', 'Original Music Composer'),
      ],
    },
    videos: {
      id: 603,
      results: [
        { iso_639_1: 'en', iso_3166_1: 'US', name: 'Bogus Trailer', key: 'bogus', site: 'Vimeo', size: 1080, type: 'Trailer', official: true, published_at: '', id: 'v0' },
        { iso_639_1: 'en', iso_3166_1: 'US', name: 'Fan Trailer', key: 'fan', site: 'YouTube', size: 1080, type: 'Trailer', official: false, published_at: '', id: 'v1' },
        { iso_639_1: 'en', iso_3166_1: 'US', name: 'Official Trailer', key: 'official', site: 'YouTube', size: 1080, type: 'Trailer', official: true, published_at: '', id: 'v2' },
      ],
    },
    images: { id: 603, backdrops: [], logos: [], posters: [] },
    recommendations: {
      page: 1,
      results: [
        {
          poster_path: '/r1.jpg',
          adult: false,
          overview: '',
          release_date: '2003-05-15',
          genre_ids: [28],
          id: 604,
          original_title: 'The Matrix Reloaded',
          original_language: 'en',
          original_name: 'The Matrix Reloaded',
          name: 'The Matrix Reloaded',
          first_air_date: '',
          title: 'The Matrix Reloaded',
          backdrop_path: '/rb1.jpg',
          popularity: 30,
          vote_count: 8000,
          video: false,
          vote_average: 6.7,
          media_type: 'movie',
        },
      ],
      total_results: 1,
      total_pages: 1,
    },
    similar: { page: 1, results: [], total_results: 0, total_pages: 0 },
    release_dates: releaseDates([
      { code: 'US', certs: ['R', ''] },
      { code: 'DE', certs: ['16'] },
    ]),
    'watch/providers': { id: 603, results: {} },
    external_ids: {
      id: 603,
      imdb_id: 'tt0133093',
      facebook_id: null,
      instagram_id: null,
      twitter_id: null,
    },
    keywords: { id: 603, keywords: [{ id: 979, name: 'simülasyon' }] },
    translations: { id: 603, translations: [] },
    ...overrides,
  }
}

function tvFull(overrides: Partial<TvDetailFull> = {}): TvDetailFull {
  return {
    backdrop_path: '/tv-backdrop.jpg',
    created_by: [{ id: 1930, credit_id: 'x', name: 'David Benioff', gender: 2, profile_path: '/db.jpg' }],
    episode_run_time: [55],
    first_air_date: '2011-04-17',
    genres: [{ id: 18, name: 'Drama' }],
    homepage: '',
    id: 1399,
    in_production: false,
    languages: ['en'],
    last_air_date: '2019-05-19',
    last_episode_to_air: {
      air_date: '2019-05-19',
      episode_number: 6,
      id: 1,
      name: 'The Iron Throne',
      overview: '',
      production_code: '',
      season_number: 8,
      still_path: '',
      vote_average: 0,
      vote_count: 0,
    },
    name: 'Game of Thrones',
    networks: [{ name: 'HBO', id: 49, logo_path: '/hbo.png', origin_country: 'US' }],
    number_of_episodes: 73,
    number_of_seasons: 8,
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Game of Thrones',
    overview: 'Yedi soylu aile demir taht için savaşır.',
    popularity: 300,
    poster_path: '/tv-poster.jpg',
    production_companies: [],
    production_countries: [],
    seasons: [
      { air_date: '2011-04-17', episode_count: 10, id: 1, name: 'Season 1', overview: '', poster_path: '/s1.jpg', season_number: 1, vote_average: 8, vote_count: 100 },
      { air_date: '2012-04-01', episode_count: 10, id: 2, name: 'Season 2', overview: '', poster_path: '/s2.jpg', season_number: 2, vote_average: 8, vote_count: 90 },
      { air_date: '', episode_count: 0, id: 3, name: 'Specials', overview: '', poster_path: '', season_number: 0, vote_average: 0, vote_count: 0 },
    ],
    spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
    status: 'Ended',
    tagline: '',
    type: 'Scripted',
    vote_average: 8.4,
    vote_count: 13000,
    credits: {
      id: 1399,
      cast: [
        {
          adult: false, gender: 1, id: 73997, known_for_department: 'Acting',
          name: 'Emilia Clarke', original_name: 'Emilia Clarke', popularity: 40,
          profile_path: '/emilia.jpg', character: 'Daenerys Targaryen', credit_id: 'cc1', order: 0,
          total_episode_count: 62,
          roles: [
            { credit_id: 'r1', episode_count: 62, character: 'Daenerys Targaryen' },
            { credit_id: 'r2', episode_count: 1, character: 'Khal Drogo halısı anlatıcısı' },
          ],
        },
      ],
      crew: [crewEntry(50, 'David Benioff', 'Writer')],
    },
    videos: { id: 1399, results: [] },
    images: { id: 1399, backdrops: [], logos: [], posters: [] },
    recommendations: {
      page: 1,
      results: [
        {
          poster_path: '/rec.jpg', popularity: 10, id: 46648, backdrop_path: '/rec-bd.jpg',
          vote_average: 7.5, overview: '', first_air_date: '2013-01-01', origin_country: ['US'],
          genre_ids: [18], original_language: 'en', vote_count: 500, name: 'True Detective',
          original_name: 'True Detective',
        },
      ],
      total_results: 1,
      total_pages: 1,
    },
    similar: { page: 1, results: [], total_results: 0, total_pages: 0 },
    content_ratings: {
      id: 1399,
      results: [
        { iso_3166_1: 'TR', rating: '16+' },
        { iso_3166_1: 'US', rating: 'TV-MA' },
      ],
    },
    'watch/providers': { id: 1399, results: {} },
    external_ids: { id: 1399, imdb_id: 'tt0944947' },
    keywords: { id: 1399, results: [{ id: 123, name: 'ejderha' }] },
    translations: { id: 1399, translations: [] },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('formatRuntime', () => {
  it('formats hours and minutes in Turkish', () => {
    expect(formatRuntime(134)).toBe('2s 14dk')
    expect(formatRuntime(60)).toBe('1s')
    expect(formatRuntime(45)).toBe('45dk')
  })

  it('is null-safe', () => {
    expect(formatRuntime(null)).toBeNull()
    expect(formatRuntime(0)).toBeNull()
    expect(formatRuntime(undefined)).toBeNull()
  })
})

describe('formatMoney', () => {
  it('formats whole dollars and hides zero/missing', () => {
    expect(formatMoney(63_000_000)).toBe('$63,000,000')
    expect(formatMoney(0)).toBeNull()
    expect(formatMoney(null)).toBeNull()
  })
})

describe('translateStatus', () => {
  it('maps known statuses to Turkish', () => {
    expect(translateStatus('Released')).toBe('Vizyonda')
    expect(translateStatus('Returning Series')).toBe('Devam Ediyor')
    expect(translateStatus('Ended')).toBe('Tamamlandı')
  })

  it('passes unknown statuses through', () => {
    expect(translateStatus('Weird')).toBe('Weird')
    expect(translateStatus(null)).toBe('')
  })
})

describe('isNotFoundError', () => {
  it('detects HTTP 404 and TMDB status_code 34', () => {
    expect(isNotFoundError({ status: 404 })).toBe(true)
    expect(isNotFoundError({ status: 400, data: { status_code: 34 } })).toBe(true)
  })

  it('rejects other errors and non-fetch errors', () => {
    expect(isNotFoundError({ status: 500 })).toBe(false)
    expect(isNotFoundError({ status: 400, data: { status_code: 7 } })).toBe(false)
    expect(isNotFoundError({ message: 'oops' })).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
  })
})

describe('slugToId', () => {
  it('extracts numeric ids from slug or plain forms', () => {
    expect(slugToId('603-the-matrix')).toBe(603)
    expect(slugToId('603')).toBe(603)
  })

  it('returns null for malformed input', () => {
    expect(slugToId('the-matrix')).toBeNull()
    expect(slugToId(undefined)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

describe('findMovieCertification', () => {
  it('prefers the requested region and skips empty certs', () => {
    expect(findMovieCertification(releaseDates([{ code: 'TR', certs: ['', '15'] }]), 'TR')).toBe('15')
  })

  it('falls back to the first non-empty country', () => {
    expect(findMovieCertification(releaseDates([{ code: 'US', certs: ['R'] }]), 'TR')).toBe('R')
  })

  it('returns null when nothing qualifies', () => {
    expect(findMovieCertification(releaseDates([{ code: 'US', certs: ['', ''] }]), 'TR')).toBeNull()
    expect(findMovieCertification(undefined, 'TR')).toBeNull()
  })
})

describe('findTvCertification', () => {
  const ratings = { id: 1, results: [{ iso_3166_1: 'TR', rating: '16+' }, { iso_3166_1: 'US', rating: 'TV-MA' }] }

  it('prefers the requested region, then first non-empty', () => {
    expect(findTvCertification(ratings, 'TR')).toBe('16+')
    expect(findTvCertification(ratings, 'DE')).toBe('16+')
  })

  it('returns null for empty results', () => {
    expect(findTvCertification({ id: 1, results: [] }, 'TR')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Trailer
// ---------------------------------------------------------------------------

describe('pickTrailer', () => {
  it('prefers the first official YouTube trailer', () => {
    const picked = pickTrailer(movieFull().videos)
    expect(picked?.key).toBe('official')
  })

  it('falls back to a non-official YouTube trailer', () => {
    const videos = {
      results: [
        { key: 'teaser', name: 'Teaser', site: 'YouTube', type: 'Teaser', official: true },
        { key: 'fan', name: 'Fan Trailer', site: 'YouTube', type: 'Trailer', official: false },
      ],
    }
    expect(pickTrailer(videos)?.key).toBe('fan')
  })

  it('returns null when no YouTube trailer exists', () => {
    expect(pickTrailer({ results: [] })).toBeNull()
    expect(pickTrailer(undefined)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Recommendation mapping
// ---------------------------------------------------------------------------

describe('resultListToSummaries', () => {
  it('maps movie-flavor results', () => {
    const [first] = resultListToSummaries(movieFull().recommendations.results, 'movie')
    expect(first).toMatchObject({ id: 604, media_type: 'movie', title: 'The Matrix Reloaded' })
  })

  it('maps tv-flavor results (name → title)', () => {
    const [first] = resultListToSummaries(tvFull().recommendations.results, 'tv')
    expect(first).toMatchObject({ id: 46648, media_type: 'tv', title: 'True Detective', release_date: '2013-01-01' })
  })

  it('tolerates undefined lists', () => {
    expect(resultListToSummaries(undefined, 'movie')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Dossier builders
// ---------------------------------------------------------------------------

describe('buildMovieDossier', () => {
  const dossier = buildMovieDossier(movieFull(), 'US')

  it('builds meta chips (year, runtime, certification)', () => {
    expect(dossier.metaChips).toEqual(['1999', '2s 16dk', 'R'])
  })

  it('extracts directors, dedupes writers, caps at 3 and drops empty groups', () => {
    const labels = dossier.crew.map((g) => g.label)
    expect(labels).toEqual(['Yönetmen', 'Senaryo', 'Müzik'])
    const directors = dossier.crew[0].people
    expect(directors.map((p) => p.name)).toEqual(['Lana Wachowski', 'Lilly Wachowski'])
  })

  it('normalizes cast and links the official trailer', () => {
    expect(dossier.cast[0]).toMatchObject({ id: 1, name: 'Keanu Reeves', character: 'Neo' })
    expect(dossier.trailerKey).toBe('official')
    expect(dossier.imdbId).toBe('tt0133093')
  })

  it('carries keywords, recommendations and hides budget rows at 0', () => {
    expect(dossier.keywords).toEqual([{ id: 979, name: 'simülasyon' }])
    expect(dossier.recommendations).toHaveLength(1)
    expect(dossier.facts.find((f) => f.label === 'Bütçe')).toBeUndefined()
    expect(dossier.facts.find((f) => f.label === 'Durum')?.value).toBe('Vizyonda')
  })

  it('keeps the original title only when it differs', () => {
    expect(dossier.originalTitle).toBeNull()
    const turkish = buildMovieDossier(movieFull({ title: 'Matrix' }), 'TR')
    expect(turkish.originalTitle).toBe('The Matrix')
  })

  it('exposes the collection reference when present', () => {
    const withCollection = buildMovieDossier(
      movieFull({ belongs_to_collection: { id: 234, name: 'The Matrix Collection' } }),
      'US'
    )
    expect(withCollection.collection).toEqual({ id: 234, name: 'The Matrix Collection' })
  })

  it('uses the region certification chip for the active region', () => {
    expect(buildMovieDossier(movieFull(), 'DE').metaChips).toContain('16')
  })
})

describe('buildTvDossier', () => {
  const dossier = buildTvDossier(tvFull(), 'TR')

  it('builds season/episode/certification chips', () => {
    expect(dossier.metaChips).toEqual(['2011', '8 Sezon', '73 Bölüm', '16+'])
    expect(buildTvDossier(tvFull(), 'US').metaChips).toContain('TV-MA')
  })

  it('uses created_by as the first crew group', () => {
    expect(dossier.crew[0]).toMatchObject({ label: 'Yaratıcı' })
    expect(dossier.crew[0].people).toEqual([{ id: 1930, name: 'David Benioff' }])
  })

  it('joins TV roles into the character field and keeps episode counts', () => {
    expect(dossier.cast[0].character).toContain('Daenerys Targaryen / ')
    expect(dossier.cast[0].episodeCount).toBe(62)
  })

  it('filters empty seasons out of the navigator strip', () => {
    expect(dossier.seasons?.map((s) => s.seasonNumber)).toEqual([1, 2])
    expect(dossier.seasons?.[0]).toMatchObject({ episodeCount: 10, posterPath: '/s1.jpg' })
  })

  it('reads tv keywords from results and maps recommendations as tv', () => {
    expect(dossier.keywords).toEqual([{ id: 123, name: 'ejderha' }])
    expect(dossier.recommendations[0].media_type).toBe('tv')
  })
})
