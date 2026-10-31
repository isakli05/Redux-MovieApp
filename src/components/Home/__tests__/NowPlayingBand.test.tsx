import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Result as MovieResult } from '@/types/Movies'
import { useGetNowPlayingMoviesQuery } from '@api/endpoints/movies.endpoints'
import { NowPlayingBand } from '../NowPlayingBand'

vi.mock('@api/endpoints/movies.endpoints', () => ({
  useGetNowPlayingMoviesQuery: vi.fn(),
}))

const mockNowPlaying = vi.mocked(useGetNowPlayingMoviesQuery)

const makeMovie = (id: number, title: string): MovieResult => ({
  id,
  title,
  poster_path: `/p${id}.jpg`,
  backdrop_path: `/b${id}.jpg`,
  release_date: '2026-01-15',
  overview: 'Özet',
  vote_average: 7.8,
  vote_count: 1200,
  popularity: 50,
  adult: false,
  video: false,
  media_type: 'movie',
  original_title: title,
  original_language: 'tr',
  genre_ids: [1],
  first_air_date: '',
  name: '',
  original_name: '',
})

function setQueryResult(result: Partial<ReturnType<typeof useGetNowPlayingMoviesQuery>>) {
  mockNowPlaying.mockReturnValue({
    data: undefined,
    isLoading: false,
    refetch: vi.fn(),
    ...result,
  } as unknown as ReturnType<typeof useGetNowPlayingMoviesQuery>)
}

function renderBand() {
  return render(
    <MemoryRouter>
      <NowPlayingBand />
    </MemoryRouter>
  )
}

describe('NowPlayingBand', () => {
  it('renders the first item as a featured backdrop card plus poster tiles', () => {
    setQueryResult({
      data: {
        page: 1,
        results: [makeMovie(1, 'Ana Yapım'), ...[2, 3, 4, 5].map((i) => makeMovie(i, `Film ${i}`))],
        total_pages: 1,
        total_results: 5,
      },
    })

    renderBand()

    expect(screen.getByRole('heading', { name: 'Vizyonda' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ana Yapım' })).toBeInTheDocument()
    expect(screen.getByAltText('Ana Yapım sahnesi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ana Yapım/ })).toHaveAttribute('href', '/movie/1')
    expect(screen.getByAltText('Film 2 afişi')).toBeInTheDocument()
  })

  it('renders an ErrorState with retry when the query fails', () => {
    const refetch = vi.fn()
    setQueryResult({ isLoading: false, isError: true, refetch })

    renderBand()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders skeletons while loading', () => {
    setQueryResult({ isLoading: true })

    const { container } = renderBand()

    expect(screen.getByRole('heading', { name: 'Vizyonda' })).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
  })
})
