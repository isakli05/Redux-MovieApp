/**
 * TvSeasonsList — hata öncelikli akış (defect P) ve tembel medya kapılaması
 * (defect V) testleri. API katmanı mock'lanır; skip seçenekleri üzerinden
 * "hangi isteğin ağa çıkacağı" doğrulanır.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { TvDetails, Season } from '@/types/tvsDetails'
import type { SeasonVideo } from '@/types/seasonVideos'

const mocks = vi.hoisted(() => ({
  tvDetail: vi.fn(),
  seasonVideos: vi.fn(),
  seasonCredits: vi.fn(),
}))

vi.mock('@api/endpoints/tv.endpoints', () => ({
  useGetTVShowDetailsQuery: mocks.tvDetail,
  useGetSeasonVideosQuery: mocks.seasonVideos,
  useGetSeasonAggregateCreditsQuery: mocks.seasonCredits,
}))

import TvSeasonsList from '@pages/Tvs/TvSeasonsList'

// --- Fixtures -----------------------------------------------------------------

const seasons: Season[] = [
  {
    air_date: '2019-01-20',
    episode_count: 10,
    id: 101,
    name: '1. Sezon',
    overview: 'İlk sezon özeti.',
    poster_path: '/s1.jpg',
    season_number: 1,
    vote_average: 8.4,
    vote_count: 1200,
  },
  {
    air_date: '2020-01-20',
    episode_count: 10,
    id: 102,
    name: '2. Sezon',
    overview: 'İkinci sezon özeti.',
    poster_path: '/s2.jpg',
    season_number: 2,
    vote_average: 8.8,
    vote_count: 980,
  },
  {
    air_date: '2099-01-01',
    episode_count: 8,
    id: 103,
    name: '3. Sezon',
    overview: '',
    poster_path: '/s3.jpg',
    season_number: 3,
  },
]

const tvDetail = {
  id: 42,
  name: 'Örnek Dizi',
  overview: 'Dizi genel özeti.',
  backdrop_path: '/bd.jpg',
  poster_path: '/p.jpg',
  first_air_date: '2019-01-20',
  number_of_seasons: 3,
  seasons,
} as unknown as TvDetails

const videos: SeasonVideo[] = [
  {
    id: 'v1',
    iso_639_1: 'tr',
    iso_3166_1: 'TR',
    key: 'abc123',
    name: '1. Sezon Fragmanı',
    site: 'YouTube',
    size: 1080,
    type: 'Trailer',
    official: true,
    published_at: '2019-01-01',
  },
]

const credits = {
  id: 42,
  cast: [
    {
      adult: false,
      gender: 2,
      id: 7,
      known_for_department: 'Acting',
      name: 'Oyuncu Bir',
      original_name: 'Oyuncu Bir',
      popularity: 10,
      profile_path: '/c1.jpg',
      roles: [{ credit_id: 'r1', character: 'Karakter', episode_count: 10 }],
      total_episode_count: 10,
      order: 0,
    },
  ],
  crew: [],
}

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

/** (arg, {skip}) çağrılarından skip!==true olanları sayar = ağa çıkacak istekler. */
const activeCalls = (fn: ReturnType<typeof vi.fn>): number[] =>
  fn.mock.calls
    .filter((call) => !(call[1] as { skip?: boolean } | undefined)?.skip)
    .map((call) => call[0] as { seasonNumber: number }).map((arg) => arg.seasonNumber)

function renderList() {
  return render(
    <MemoryRouter initialEntries={['/tv/42-ornek-dizi/seasons']}>
      <Routes>
        <Route path="/tv/:tv_id/seasons" element={<TvSeasonsList />} />
        <Route path="/tv/:tv_id" element={<div>Dizi Detayı</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
})

describe('TvSeasonsList — defect P (hata önce spinner\'dan)', () => {
  it('istek hata verirse ErrorState + Tekrar dene gösterir (sonsuz spinner yok)', async () => {
    const refetch = vi.fn()
    mocks.tvDetail.mockReturnValue(
      result({ error: { status: 500, data: {} }, refetch }),
    )
    // Sezon kartı hook'ları bu senaryoda mount edilmez, yine de tanımlı olsun
    mocks.seasonVideos.mockReturnValue(result())
    mocks.seasonCredits.mockReturnValue(result())

    renderList()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Sezonlar yüklenemedi')
    // Spinner/iskelet yok
    expect(document.querySelector('.shimmer')).toBeNull()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('istek yüklenirken spinner yerine düzen koruyan iskelet gösterir', () => {
    mocks.tvDetail.mockReturnValue(result({ isLoading: true }))
    mocks.seasonVideos.mockReturnValue(result({ isLoading: true }))
    mocks.seasonCredits.mockReturnValue(result({ isLoading: true }))

    renderList()

    expect(document.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('TvSeasonsList — defect V (tembel medya kapılaması)', () => {
  it('kartlar kapalıyken hiçbir sezon videosu/credits isteği ağa çıkmaz', () => {
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonVideos.mockReturnValue(result({ data: { id: 42, results: videos } }))
    mocks.seasonCredits.mockReturnValue(result({ data: credits }))

    renderList()

    // 3 kart mount edildi ama hepsi skip:true ile istedi
    expect(mocks.seasonVideos).toHaveBeenCalledTimes(3)
    expect(mocks.seasonCredits).toHaveBeenCalledTimes(3)
    expect(activeCalls(mocks.seasonVideos)).toEqual([])
    expect(activeCalls(mocks.seasonCredits)).toEqual([])
  })

  it('tek kart açınca yalnızca o sezon için 1 videosu + 1 credits isteği gider', async () => {
    mocks.tvDetail.mockReturnValue(result({ data: tvDetail }))
    mocks.seasonVideos.mockReturnValue(result({ data: { id: 42, results: videos } }))
    mocks.seasonCredits.mockReturnValue(result({ data: credits }))

    renderList()

    const user = userEvent.setup()
    const toggles = screen.getAllByRole('button', { name: /Fragman ve Kadro/i })
    expect(toggles).toHaveLength(3)

    await user.click(toggles[0])

    // Ağda: yalnızca 1. sezon için 1'er istek
    expect(activeCalls(mocks.seasonVideos)).toEqual([1])
    expect(activeCalls(mocks.seasonCredits)).toEqual([1])

    // Kadro önizleme açıldı
    expect(await screen.findByAltText('Oyuncu Bir')).toBeInTheDocument()

    // Fragman aksiyonu görünür; modal açılır
    await user.click(screen.getByRole('button', { name: /Fragman İzle/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
