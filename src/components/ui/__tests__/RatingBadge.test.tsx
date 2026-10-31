import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingBadge } from '../RatingBadge'

describe('RatingBadge', () => {
  it('exposes the TMDB score in an accessible label', () => {
    render(<RatingBadge score={7.25} />)
    expect(screen.getByRole('img', { name: 'TMDB puanı 10 üzerinden 7.3' })).toBeInTheDocument()
    expect(screen.getByText('7.3')).toBeInTheDocument()
  })

  it('renders the ring with tabular numerals', () => {
    render(<RatingBadge score={9} />)
    expect(screen.getByText('9.0')).toHaveClass('tabular-nums')
  })

  it('renders nothing for missing, zero or invalid scores', () => {
    for (const score of [undefined, null, 0, Number.NaN]) {
      const { container } = render(<RatingBadge score={score} />)
      expect(container).toBeEmptyDOMElement()
    }
  })
})
