import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PosterCard } from '../PosterCard'
import type { MediaSummary } from '@/types/mediaSummary'

const baseItem: MediaSummary = {
  id: 1,
  media_type: 'movie',
  title: 'Dune',
  poster_path: '/dune.jpg',
  vote_average: 8.1,
  release_date: '2021-09-15',
}

function renderCard(overrides: Partial<MediaSummary> = {}) {
  return render(
    <MemoryRouter>
      <PosterCard item={{ ...baseItem, ...overrides }} />
    </MemoryRouter>
  )
}

describe('PosterCard', () => {
  it.each([
    ['movie', '/movie/1'],
    ['tv', '/tv/1'],
    ['person', '/person/1'],
  ] as const)('links %s items to the %s detail route', (media_type, expectedHref) => {
    const { container } = renderCard({ media_type })
    expect(container.querySelector('a')).toHaveAttribute('href', expectedHref)
  })

  it('renders the poster image with a Turkish alt text', () => {
    renderCard()
    expect(screen.getByAltText('Dune afişi')).toBeInTheDocument()
  })

  it('falls back to a raised tile with the title initial when poster_path is null', () => {
    renderCard({ poster_path: null })
    expect(screen.getByText('D')).toBeInTheDocument()
    // The title appears both in the tile and the caption below it.
    expect(screen.getAllByText('Dune').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByAltText('Dune afişi')).toBeNull()
  })

  it('hides the rating badge when vote_average is missing (no toFixed crash)', () => {
    renderCard({ vote_average: undefined })
    expect(screen.queryByRole('img', { name: /TMDB puanı/ })).toBeNull()
  })

  it('hides the rating badge when vote_average is 0', () => {
    renderCard({ vote_average: 0 })
    expect(screen.queryByRole('img', { name: /TMDB puanı/ })).toBeNull()
  })

  it('shows the rating badge with an accessible label when a score exists', () => {
    renderCard()
    expect(screen.getByRole('img', { name: 'TMDB puanı 10 üzerinden 8.1' })).toBeInTheDocument()
  })

  it('derives the year from release_date and hides it when absent', () => {
    const { rerender } = renderCard()
    expect(screen.getByText('2021')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <PosterCard item={{ ...baseItem, release_date: null }} />
      </MemoryRouter>
    )
    expect(screen.queryByText('2021')).toBeNull()
  })
})
