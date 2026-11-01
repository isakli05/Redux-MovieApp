/**
 * TvSeasonDetail — hata öncelikli akış (defect P) ve spoiler koruması içeren
 * bölüm listesi. MediaGallery mock'lanır (kendi testleri başka yerde).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { TvDetails } from '@/types/tvsDetails'
import type { TvSeasons, Episode } from '@/types/tvSeasons'

const mocks = vi.hoisted(() => ({
  tvDetail: vi.fn(),
  seasonDetail: vi.fn(),
  seasonVideos: vi.fn(),
}))

vi.mock('@api/endpoints/tv.endpoints', () => ({
  useGetTVShowDetailsQuery: mocks.tvDetail,
  useGetTVSeasonDetailsQuery: mocks.seasonDetail,
  useGetSeasonVideosQuery: mocks.seasonVideos,
}))

vi.mock('@components/MediaGallery/MediaGallery', () => ({
  default: () => <div data-testid="media-gallery" />,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    bootstrapped: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

import TvSeasonDetail from '@pages/Tvs/TvSeasonDetail'

// --- Fixtures -----------------------------------------------------------------

const episode = (over: Partial<Episode>): Episode => ({
  air_date: '2019-01-20',
  episode_number: 1,
  crew: [],
  guest_stars: [],
  id: 1,
  name: 'Pilot',
  overview: 'Bölüm özeti.',
  production_code: '',
  season_number: 1,
  still_path: '/still.jpg',
  vote_average: 8.1,
  vote_count: 240,
  runtime: 45,
  ...over,
})

const seasonDetail: TvSeasons = {
  _id: 'abc',
  air_date: '2019-01-20',
  episodes: [
    episode({ id: 1, episode_number: 1 }),
    // Yayınlanmamış bölüm (spoiler koruması)
    episode({
      id: 2,
      episode_number: 2,
      name: 'Gelecek Bölüm',
      air_date: '2099-01-01',
      still_path: '/spoiler.jpg',
      overview: 'Spoiler içeren özet.',
      vote_average: 0,
      vote_count: 0,
    }),
  ],
  name: '1. Sezon',
  overview: 'Sezon özeti.',
  id: 101,
  poster_path: '/sp.jpg',
  season_number: 1,
}

const tvDetail = {
  id: 42,
  name: 'Örnek Dizi',
  overview: 'Dizi genel özeti.',
  backdrop_path: '/bd.jpg',
  poster_path: '/p.jpg',
  first_air_date: '2019-01-20',
  number_of_seasons: 2,
  seasons: [],
} as unknown as TvDetails

type QueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  isFetching: boolean
  error: unknown
  refetch: ReturnType<typeof vi.fn>
}

const result = <T,>(over: Partial<QueryResult<T>> = {}): QueryResult<T> => ({
  data: undefined,
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: vi.fn(),
  ...over,
})

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/tv/42-ornek-dizi/season/1']}>
      <Routes>
        <Route path="/tv/:tv_id/season/:season_number" element={<TvSeasonDetail />} />
        <Route path="/tv/:tv_id/seasons" element={<div>Sezonlar</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
})

describe('TvSeasonDetail — defect P (hata önce spinner\'dan)', () => {
  it('sezon isteği hata verirse ErrorState + Tekrar dene gösterir', async () => {
    const refetch = vi.fn()
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonDetail.mockReturnValue(result({ error: { status: 500, data: {} }, refetch }))
    mocks.seasonVideos.mockReturnValue(result())

    renderDetail()

    expect(screen.getByRole('alert')).toHaveTextContent('Sezon yüklenemedi')
    expect(document.querySelector('.shimmer')).toBeNull()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('yüklenirken spinner yerine iskelet gösterir', () => {
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonDetail.mockReturnValue(result({ isLoading: true }))
    mocks.seasonVideos.mockReturnValue(result())

    renderDetail()

    expect(document.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('TvSeasonDetail — içerik ve spoiler koruması', () => {
  it('başlık, bölüm listesi ve istatistikler render edilir', () => {
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonDetail.mockReturnValue(result({ data: seasonDetail }))
    mocks.seasonVideos.mockReturnValue(result())

    renderDetail()

    expect(screen.getByRole('heading', { level: 1, name: '1. Sezon' })).toBeInTheDocument()
    expect(screen.getAllByText(/2 Bölüm/).length).toBeGreaterThan(0) // başlık + filtre çubuğu
    expect(screen.getByTestId('media-gallery')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /2\. Sezon/i })).toBeInTheDocument() // sonraki sezon gezinmesi
  })

  it('yayınlanmamış bölümde still, puan ve özet gizlenir', () => {
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonDetail.mockReturnValue(result({ data: seasonDetail }))
    mocks.seasonVideos.mockReturnValue(result())

    renderDetail()

    // Yayınlanmış bölümün görseli var
    expect(screen.getByAltText('1. bölüm görünütüsü')).toBeInTheDocument()
    // Yayınlanmamış bölümün görseli ve özeti yok
    expect(screen.queryByAltText('2. bölüm görünütüsü')).toBeNull()
    expect(screen.queryByText('Spoiler içeren özet.')).toBeNull()
    expect(screen.getAllByText(/Henüz yayınlanmadı/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/spoiler koruması/i)).toBeInTheDocument()
  })
})
