import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../components/Footer'

describe('Footer', () => {
  it('renders the exact TMDB attribution sentence with a themoviedb.org link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    expect(
      screen.getByText(
        'This product uses the TMDB API but is not endorsed or certified by TMDB.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /TMDB web sitesi/ })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org'
    )
  })

  it('renders the JustWatch attribution', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    expect(
      screen.getByText('Yayın bilgileri JustWatch tarafından sağlanır.')
    ).toBeInTheDocument()
  })

  it('renders the sitemap columns with working links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    const expected: [string, string][] = [
      ['Keşfet', '/kesfet'],
      ['Arama', '/search'],
      ['Vizyondakiler', '/movie/now-playing'],
      ['Yakında', '/movie/upcoming'],
      ['Popüler Kişiler', '/person'],
      ['Listelerim', '/lists'],
    ]
    for (const [label, href] of expected) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
    // "Popüler" appears in both the Filmler and Diziler columns.
    const popularLinks = screen.getAllByRole('link', { name: 'Popüler' })
    expect(popularLinks.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/movie', '/tv'])
    )
    expect(screen.getByRole('link', { name: "Günün Programı" })).toHaveAttribute(
      'href',
      '/tv/airing-today'
    )
    expect(screen.getByRole('link', { name: 'Televizyonda' })).toHaveAttribute('href', '/tv/on-the-air')
  })

  it('contains no statistics or number counters', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    expect(container.querySelector('[data-stat], .stat, [aria-stat]')).toBeNull()
    expect(container.textContent ?? '').not.toMatch(/\d+\+ (film|dizi|kullanıcı)/i)
  })
})
