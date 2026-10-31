import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RailSection } from '../RailSection'
import type { RailSectionProps } from '../RailSection'

function renderRail(props: Partial<RailSectionProps<string>> = {}) {
  return render(
    <MemoryRouter>
      <RailSection<string>
        title="Deneme Rayı"
        eyebrow="Test"
        isLoading={false}
        renderItem={(item) => <div key={item}>{item}</div>}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('RailSection', () => {
  it('renders skeletons under the section header while loading', () => {
    const { container } = renderRail({ isLoading: true })

    expect(screen.getByRole('heading', { name: 'Deneme Rayı' })).toBeInTheDocument()
    // PosterCardSkeleton = poster + 2 line shimmer blocks each.
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThanOrEqual(6)
  })

  it('renders an ErrorState with retry on failure', () => {
    const onRetry = vi.fn()
    renderRail({ isLoading: false, isError: true, onRetry })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides the entire section when the item list is empty', () => {
    const { container } = renderRail({ items: [] })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders items as a scroll-snap list with a footer note', () => {
    renderRail({ items: ['A', 'B'], footer: <p>JustWatch verileriyle</p> })

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('JustWatch verileriyle')).toBeInTheDocument()
  })

  it('treats undefined items like loading (skeleton, no crash)', () => {
    const { container } = renderRail({ items: undefined, isLoading: false })
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
  })
})
