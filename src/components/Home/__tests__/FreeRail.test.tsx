import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useGetFreeToWatchMoviesQuery } from '@api/endpoints/movies.endpoints'
import { useRegion } from '@hooks/useRegion'
import type { Result as MovieResult } from '@/types/Movies'
import { FreeRail } from '../FreeRail'

vi.mock('@api/endpoints/movies.endpoints', () => ({
  useGetFreeToWatchMoviesQuery: vi.fn(),
}))

vi.mock('@hooks/useRegion', () => ({
  useRegion: vi.fn(),
}))

const mockFree = vi.mocked(useGetFreeToWatchMoviesQuery)
const mockRegion = vi.mocked(useRegion)

const makeMovie = (id: number): MovieResult => ({
  id,
  title: `Ücretsiz Film ${id}`,
  poster_path: `/p${id}.jpg`,
  backdrop_path: '',
  release_date: '2024-05-01',
  overview: '',
  vote_average: 6.5,
  vote_count: 40,
  popularity: 10,
  adult: false,
  video: false,
  media_type: 'movie',
  original_title: '',
  original_language: 'tr',
  genre_ids: [],
  first_air_date: '',
  name: '',
  original_name: '',
})

describe('FreeRail', () => {
  it('requests free movies with the region from useRegion (fix I)', () => {
    mockRegion.mockReturnValue({
      region: 'TR',
      setRegion: vi.fn(),
      regions: [{ iso_3166_1: 'TR', english_name: 'Turkey', native_name: 'Türkiye' }],
    })
    mockFree.mockReturnValue({
      data: { page: 1, results: [makeMovie(1)], total_pages: 1, total_results: 1 },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetFreeToWatchMoviesQuery>)

    render(
      <MemoryRouter>
        <FreeRail />
      </MemoryRouter>
    )

    expect(mockFree).toHaveBeenCalledWith({ region: 'TR' })
  })

  it('shows the region name and JustWatch attribution under the rail (D7)', () => {
    mockRegion.mockReturnValue({
      region: 'TR',
      setRegion: vi.fn(),
      regions: [{ iso_3166_1: 'TR', english_name: 'Turkey', native_name: 'Türkiye' }],
    })
    mockFree.mockReturnValue({
      data: { page: 1, results: [makeMovie(1), makeMovie(2)], total_pages: 1, total_results: 2 },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetFreeToWatchMoviesQuery>)

    render(
      <MemoryRouter>
        <FreeRail />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Ücretsiz İzle' })).toBeInTheDocument()
    expect(screen.getByText(/Türkiye bölgesinde ücretsiz içerikler/)).toBeInTheDocument()
    expect(screen.getByText(/JustWatch verileriyle/)).toBeInTheDocument()
  })

  it('falls back to the region code when the region list has not loaded yet', () => {
    mockRegion.mockReturnValue({ region: 'DE', setRegion: vi.fn(), regions: undefined })
    mockFree.mockReturnValue({
      data: { page: 1, results: [makeMovie(1)], total_pages: 1, total_results: 1 },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetFreeToWatchMoviesQuery>)

    render(
      <MemoryRouter>
        <FreeRail />
      </MemoryRouter>
    )

    expect(screen.getByText(/DE bölgesinde ücretsiz içerikler/)).toBeInTheDocument()
  })
})
