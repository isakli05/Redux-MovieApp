import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { DetailDossierData } from '../detail.types'

const { providersState } = vi.hoisted(() => ({
  providersState: { data: undefined, isLoading: false },
}))

vi.mock('@api/endpoints/providers.endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/endpoints/providers.endpoints')>()
  return {
    ...actual,
    useGetWatchProvidersQuery: () => providersState,
  }
})

vi.mock('@hooks/useRegion', () => ({
  useRegion: () => ({ region: 'TR', setRegion: vi.fn(), regions: [] }),
}))

const mediaGalleryMock = vi.fn((_props: { mediaType: string; id: string }) => (
  <div data-testid="media-gallery-mock" />
))
vi.mock('@components/MediaGallery/MediaGallery', () => ({
  default: (props: { mediaType: string; id: string }) => mediaGalleryMock(props),
}))

import { DetailDossier } from '../DetailDossier'

function baseData(overrides: Partial<DetailDossierData> = {}): DetailDossierData {
  return {
    id: 603,
    slug: '603',
    mediaType: 'movie',
    title: 'The Matrix',
    originalTitle: null,
    tagline: 'Welcome to the Real World',
    overview: 'Bir bilgisayar korsanı, gizli gerçekliği keşfeder ve insanlığın kaderini değiştirir.',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    voteAverage: 8.2,
    metaChips: ['1999', '2s 16dk', 'R'],
    genres: [{ id: 28, name: 'Aksiyon' }, { id: 878, name: 'Bilim Kurgu' }],
    crew: [
      { label: 'Yönetmen', people: [{ id: 10, name: 'Lana Wachowski' }] },
      { label: 'Senaryo', people: [{ id: 12, name: 'The Wachowskis' }] },
    ],
    cast: [
      { id: 1, name: 'Keanu Reeves', character: 'Neo', profilePath: '/k.jpg' },
      { id: 2, name: 'Carrie-Anne Moss', character: 'Trinity', profilePath: null },
    ],
    trailerKey: 'official',
    trailerName: 'Official Trailer',
    imdbId: 'tt0133093',
    keywords: [{ id: 979, name: 'simülasyon' }],
    recommendations: [
      {
        id: 604,
        media_type: 'movie',
        title: 'The Matrix Reloaded',
        poster_path: '/r.jpg',
        release_date: '2003-05-15',
        vote_average: 6.7,
      },
    ],
    hasMedia: true,
    facts: [
      { label: 'Durum', value: 'Vizyonda' },
      { label: 'Bütçe', value: '$63,000,000' },
    ],
    collection: null,
    ...overrides,
  }
}

function renderDossier(data: DetailDossierData) {
  return render(
    <MemoryRouter initialEntries={['/movie/603']}>
      <DetailDossier data={data} />
    </MemoryRouter>
  )
}

describe('DetailDossier', () => {
  beforeEach(() => {
    mediaGalleryMock.mockClear()
    providersState.data = undefined
    providersState.isLoading = false
  })

  it('renders the title block: title, tagline, chips, genres, rating', () => {
    renderDossier(baseData())

    expect(screen.getByRole('heading', { level: 1, name: /the matrix/i })).toBeInTheDocument()
    expect(screen.getByText('Welcome to the Real World')).toBeInTheDocument()
    expect(screen.getByText('1999')).toBeInTheDocument()
    expect(screen.getByText('2s 16dk')).toBeInTheDocument()
    expect(screen.getByText('Aksiyon')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /tmdb puanı 10 üzerinden 8\.2/i })).toBeInTheDocument()
  })

  it('links crew names to person pages and hides the original title when identical', () => {
    renderDossier(baseData({ originalTitle: 'The Matrix' }))
    expect(screen.getAllByText('The Matrix').length).toBeGreaterThanOrEqual(1)

    const director = screen.getByText('Lana Wachowski')
    expect(director.closest('a')).toHaveAttribute('href', '/person/10')
  })

  it('links IMDb and TMDB externally, and shows the Fragman button only with a trailer', () => {
    renderDossier(baseData())

    expect(screen.getByRole('link', { name: 'IMDb' })).toHaveAttribute(
      'href',
      'https://imdb.com/title/tt0133093'
    )
    expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/movie/603'
    )
    expect(screen.getByRole('button', { name: /fragman/i })).toBeInTheDocument()
  })

  it('hides the Fragman button, IMDb link and rating when the data is missing', () => {
    renderDossier(baseData({ trailerKey: null, imdbId: null, voteAverage: 0 }))
    expect(screen.queryByRole('button', { name: /fragman/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'IMDb' })).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /tmdb puanı/i })).not.toBeInTheDocument()
  })

  it('opens the trailer modal on click and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderDossier(baseData())

    await user.click(screen.getByRole('button', { name: /fragman/i }))

    const dialog = screen.getByRole('dialog', { name: /fragman: official trailer/i })
    const iframe = within(dialog).getByTitle('Fragman: Official Trailer')
    expect(iframe).toHaveAttribute('src', expect.stringContaining('official'))

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders four content tabs and switches between them', async () => {
    const user = userEvent.setup()
    renderDossier(baseData())

    const tablist = screen.getByRole('tablist', { name: 'İçerik sekmeleri' })
    expect(within(tablist).getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Kadro',
      'Medya',
      'Öneriler',
      'Detaylar',
    ])

    // Kadro default: cast rail with person links + "Tümünü Gör" to cast page.
    expect(screen.getByText('Keanu Reeves').closest('a')).toHaveAttribute('href', '/person/1')
    expect(screen.getByText('Tümünü Gör').closest('a')).toHaveAttribute('href', '/movie/603/cast')

    // Medya: MediaGallery consumed read-only with the right args.
    await user.click(within(tablist).getByRole('tab', { name: 'Medya' }))
    expect(mediaGalleryMock).toHaveBeenCalledWith(expect.objectContaining({ mediaType: 'movie', id: '603' }))

    // Öneriler: PosterCard grid.
    await user.click(within(tablist).getByRole('tab', { name: 'Öneriler' }))
    expect(screen.getByText('The Matrix Reloaded')).toBeInTheDocument()

    // Detaylar: keyword chips + facts.
    await user.click(within(tablist).getByRole('tab', { name: 'Detaylar' }))
    expect(screen.getByText('simülasyon').closest('a')).toHaveAttribute(
      'href',
      '/keyword/979-simulasyon/movie'
    )
    expect(screen.getByText('$63,000,000')).toBeInTheDocument()
  })

  it('hides empty tabs (no cast, no media, no recommendations)', () => {
    renderDossier(
      baseData({ cast: [], hasMedia: false, recommendations: [], keywords: [], facts: [] })
    )
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('renders the fallback poster tile when the poster is missing', () => {
    renderDossier(baseData({ posterPath: null }))
    expect(screen.queryAllByAltText('The Matrix afişi')).toHaveLength(0)
    expect(screen.getAllByText('T').length).toBeGreaterThan(0) // initial letter fallback
  })

  it('shows the empty-overview note when there is no overview', () => {
    renderDossier(baseData({ overview: '' }))
    expect(screen.getByText('Açıklama bulunmuyor.')).toBeInTheDocument()
  })

  it('renders the seasons strip for TV data with season links', () => {
    renderDossier(
      baseData({
        mediaType: 'tv',
        seasons: [
          { seasonNumber: 1, name: 'Season 1', airDate: '2011-04-17', episodeCount: 10, posterPath: '/s1.jpg' },
          { seasonNumber: 2, name: 'Season 2', airDate: '2012-04-01', episodeCount: 10, posterPath: null },
        ],
      })
    )

    const seasons = screen.getByRole('region', { name: 'Sezonlar' }) ||
      screen.getByLabelText('Sezonlar')
    const seasonOne = within(seasons).getByRole('link', { name: /1\. sezon/i })
    expect(seasonOne).toHaveAttribute('href', '/tv/603/season/1')
    expect(within(seasons).getByRole('link', { name: /tüm sezonlar/i })).toHaveAttribute(
      'href',
      '/tv/603/seasons'
    )
  })
})
