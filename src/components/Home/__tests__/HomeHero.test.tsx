import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { MediaSummary } from '@/types/mediaSummary'
import { useGetTrendingMixedQuery } from '@api/endpoints/movies.endpoints'
import { HomeHero } from '../HomeHero'

vi.mock('@api/endpoints/movies.endpoints', () => ({
  useGetTrendingMixedQuery: vi.fn(),
}))

const mockTrending = vi.mocked(useGetTrendingMixedQuery)

const slides: MediaSummary[] = [
  {
    id: 11,
    media_type: 'movie',
    title: 'Kum Fırtınası',
    poster_path: '/p1.jpg',
    backdrop_path: '/b1.jpg',
    vote_average: 8.2,
    release_date: '2026-03-01',
    overview: 'İlk slayt özeti.',
  },
  {
    id: 22,
    media_type: 'tv',
    title: 'Gece Yarısı Dizisi',
    poster_path: '/p2.jpg',
    backdrop_path: '/b2.jpg',
    vote_average: 7.4,
    release_date: '2025-11-10',
    overview: 'İkinci slayt özeti.',
  },
  {
    id: 33,
    media_type: 'movie',
    title: 'Üçüncü Yapım',
    poster_path: '/p3.jpg',
    backdrop_path: '/b3.jpg',
    vote_average: 0,
    release_date: null,
  },
]

function setQueryResult(result: Partial<ReturnType<typeof useGetTrendingMixedQuery>>) {
  mockTrending.mockReturnValue({
    data: undefined,
    isLoading: false,
    refetch: vi.fn(),
    ...result,
  } as unknown as ReturnType<typeof useGetTrendingMixedQuery>)
}

function renderHero() {
  return render(
    <MemoryRouter>
      <HomeHero />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('HomeHero', () => {
  it('renders the first slide with title, meta chips and detail buttons', () => {
    setQueryResult({ data: { page: 1, results: slides, total_pages: 1 } })

    renderHero()

    expect(screen.getByRole('heading', { level: 1, name: 'Kum Fırtınası' })).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByText('Film')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'TMDB puanı 10 üzerinden 8.2' })).toBeInTheDocument()

    const detail = screen.getByRole('link', { name: 'Detaylar' })
    expect(detail).toHaveAttribute('href', '/movie/11')
    expect(screen.getByRole('link', { name: 'Fragman' })).toHaveAttribute('href', '/movie/11')
  })

  it('hides the rating chip when the slide has no score', () => {
    setQueryResult({ data: { page: 1, results: [slides[2]], total_pages: 1 } })

    renderHero()

    expect(screen.queryByRole('img', { name: /TMDB puanı/ })).toBeNull()
  })

  it('renders one dot per slide and switches on dot click', () => {
    setQueryResult({ data: { page: 1, results: slides, total_pages: 1 } })

    renderHero()

    const dots = screen.getAllByRole('button', { name: /öne çıkanı göster/ })
    expect(dots).toHaveLength(3)

    fireEvent.click(dots[1])
    expect(screen.getByRole('heading', { name: 'Gece Yarısı Dizisi' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Kum Fırtınası' })).toBeNull()
  })

  it('renders no dots for a single slide', () => {
    setQueryResult({ data: { page: 1, results: [slides[0]], total_pages: 1 } })

    renderHero()

    expect(screen.queryAllByRole('button', { name: /öne çıkanı göster/ })).toHaveLength(0)
  })

  it('auto-advances every 7 seconds', () => {
    setQueryResult({ data: { page: 1, results: slides, total_pages: 1 } })

    renderHero()

    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(screen.getByRole('heading', { name: 'Gece Yarısı Dizisi' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(screen.getByRole('heading', { name: 'Üçüncü Yapım' })).toBeInTheDocument()
  })

  it('pauses auto-advance on hover and resumes on leave', () => {
    setQueryResult({ data: { page: 1, results: slides, total_pages: 1 } })

    const { container } = renderHero()
    const heroSection = container.querySelector('section')
    expect(heroSection).not.toBeNull()

    fireEvent.mouseEnter(heroSection!)
    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(screen.getByRole('heading', { name: 'Kum Fırtınası' })).toBeInTheDocument()

    fireEvent.mouseLeave(heroSection!)
    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(screen.getByRole('heading', { name: 'Gece Yarısı Dizisi' })).toBeInTheDocument()
  })

  it('never auto-advances under prefers-reduced-motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList
    )
    setQueryResult({ data: { page: 1, results: slides, total_pages: 1 } })

    renderHero()

    act(() => {
      vi.advanceTimersByTime(60000)
    })
    expect(screen.getByRole('heading', { name: 'Kum Fırtınası' })).toBeInTheDocument()
  })

  it('excludes person items and items without a backdrop from slides', () => {
    setQueryResult({
      data: {
        page: 1,
        results: [
          { id: 99, media_type: 'person', title: 'Bir Oyuncu', poster_path: '/x.jpg' },
          { id: 44, media_type: 'movie', title: 'Backdropsuz', poster_path: '/y.jpg' },
          slides[0],
        ],
        total_pages: 1,
      },
    })

    renderHero()

    expect(screen.getByRole('heading', { name: 'Kum Fırtınası' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    // Tek geçerli slayt kaldığı için noktalar render edilmez.
    expect(screen.queryAllByRole('button', { name: /öne çıkanı göster/ })).toHaveLength(0)
  })

  it('shows a skeleton block without titles while loading', () => {
    setQueryResult({ isLoading: true })

    const { container } = renderHero()

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
  })

  it('falls back to a static branded hero when there are no slides', () => {
    setQueryResult({ data: { page: 1, results: [], total_pages: 1 } })

    renderHero()

    expect(screen.getByRole('heading', { level: 1, name: 'Film ve Dizi Keşif' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Detaylar' })).toBeNull()
  })
})
