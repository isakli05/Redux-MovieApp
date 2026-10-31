import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CinematicCursor } from '../CinematicCursor'

function mockMatchMedia(matchesByQuery: (q: string) => boolean) {
  const impl = (query: string) => ({
    matches: matchesByQuery(query),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
  })
  vi.stubGlobal('matchMedia', vi.fn(impl))
}

describe('CinematicCursor', () => {
  beforeEach(() => {
    mockMatchMedia(() => false)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing on touch/reduced-motion environments', () => {
    const { container } = render(<CinematicCursor />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the trail canvas for fine pointers without reduced motion', () => {
    mockMatchMedia((q) =>
      q === '(pointer: fine)' ? true : q === '(prefers-reduced-motion: reduce)' ? false : false
    )
    render(<CinematicCursor />)
    expect(screen.getByTestId('cinematic-cursor')).toBeInTheDocument()
  })

  it('stays hidden when reduced motion is preferred even on fine pointers', () => {
    mockMatchMedia((q) =>
      q === '(pointer: fine)' ? true : q === '(prefers-reduced-motion: reduce)' ? true : false
    )
    const { container } = render(<CinematicCursor />)
    expect(container).toBeEmptyDOMElement()
  })
})
