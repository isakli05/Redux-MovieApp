import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecentsRail } from '../RecentsRail'

const STORAGE_KEY = 'lmdb_recents'

const entries = [
  { id: 550, media_type: 'movie' as const, title: 'Dövüş Kulübü', poster_path: '/a.jpg', at: 2000 },
  { id: 1396, media_type: 'tv' as const, title: 'Breaking Bad', poster_path: '/b.jpg', at: 9000 },
]

function renderRail() {
  return render(
    <MemoryRouter>
      <RecentsRail />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('RecentsRail', () => {
  it('renders nothing when there are no recents (no fake stats, defect T)', () => {
    const { container } = renderRail()
    expect(container).toBeEmptyDOMElement()
  })

  it('shows recents sorted by most recent visit', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    renderRail()

    const titles = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .join(' ')
    expect(titles.indexOf('Breaking Bad')).toBeLessThan(titles.indexOf('Dövüş Kulübü'))
    expect(screen.getByRole('heading', { name: 'Son Baktıklarınız' })).toBeInTheDocument()
  })

  it('links entries to their detail routes', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entries[0]]))
    renderRail()

    expect(screen.getByRole('link', { name: /Dövüş Kulübü/ })).toHaveAttribute('href', '/movie/550')
  })

  it('clears storage and hides the rail on Temizle', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    const { container } = renderRail()

    fireEvent.click(screen.getByRole('button', { name: 'Temizle' }))

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })

  it('ignores corrupt storage and renders nothing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const { container } = renderRail()
    expect(container).toBeEmptyDOMElement()
  })
})
