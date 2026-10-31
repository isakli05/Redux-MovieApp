/**
 * /search sayfası — URL-stateful kategoriler, GERÇEK toplam sayısı (defect L)
 * ve sayfalama URL senkronu (defect K). API katmanı mock'lanır.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import type { MultiSearchItem, MultiSearchResults } from '@/types/search';

// --- Fixtures ----------------------------------------------------------------

const movie = (id: number, title: string): MultiSearchItem => ({
  id,
  media_type: 'movie',
  title,
  popularity: 10,
  poster_path: null,
  release_date: '2010-01-01',
})

const multiTR: MultiSearchResults = {
  page: 1,
  total_results: 1234,
  total_pages: 63,
  results: [
    movie(1, 'Zift'),
    { id: 3, media_type: 'person', name: 'Tom Hanks', known_for_department: 'Acting', popularity: 5 },
  ],
}

const multiEN: MultiSearchResults = {
  page: 1,
  total_results: 1234,
  total_pages: 63,
  results: [movie(1, 'Inception'), movie(2, 'Interstellar')],
}

const emptyMulti: MultiSearchResults = { page: 1, total_results: 0, total_pages: 0, results: [] }

const trending: MultiSearchResults = {
  page: 1,
  total_results: 5,
  total_pages: 1,
  results: [movie(9, 'Trend Film')],
}

const moviesTR = { page: 1, total_results: 900, total_pages: 45, results: [{ id: 1, title: 'Zift', popularity: 10 }] }
const moviesEN = { page: 1, total_results: 900, total_pages: 45, results: [{ id: 2, title: 'Interstellar', popularity: 9 }] }
const tvTR = { page: 1, total_results: 300, total_pages: 15, results: [{ id: 4, name: 'Breaking Bad', first_air_date: '2008-01-20', popularity: 20 }] }
const persons = { page: 1, total_results: 12, total_pages: 1, results: [{ id: 3, name: 'Tom Hanks', profile_path: null, known_for: [], popularity: 5 }] }

const queryState = {
  multi: multiTR,
  multiEN,
  trending,
}

/** Aktif fixture'ı döndüren basit hook mock'u. */
const makeResult = (data: unknown) => ({
  data,
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
})

vi.mock('@api/index', () => ({
  useSearchMultiQuery: () => makeResult(queryState.multi),
  useSearchMultiENQuery: () => makeResult(queryState.multiEN),
  useSearchMoviesQuery: () => makeResult(moviesTR),
  useSearchMoviesENQuery: () => makeResult(moviesEN),
  useSearchTVShowsQuery: () => makeResult(tvTR),
  useSearchTVShowsENQuery: () => makeResult(tvTR),
  useSearchPersonsQuery: () => makeResult(persons),
  useGetTrendingForSearchQuery: () => makeResult(queryState.trending),
}))

import Search from '@pages/Search'

/** URL durumunu assert edilebilir kılan prob.
 * Not: MemoryRouter içinde kalmalı. */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>
}

function renderSearch(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/search"
          element={
            <>
              <Search />
              <LocationProbe />
            </>
          }
        />
        <Route path="/kesfet" element={<div>Keşfet Sayfası</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  // jsdom'da window.scrollTo implemented değil; sayfa değişiminde çağrılır.
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
  queryState.multi = multiTR
  queryState.multiEN = multiEN
  queryState.trending = trending
})

describe('Search sayfası', () => {
  it('q yoksa yönlendirici boş durum gösterir (yönlendirme yok)', () => {
    renderSearch('/search')
    expect(screen.getByText('Aramak için bir şey yazın')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Keşfet'e Git" })).toHaveAttribute('href', '/kesfet')
  })

  it('GERÇEK API total_results sayısını tr-TR gösterir (defect L)', async () => {
    renderSearch('/search?q=nolan')
    expect(await screen.findByText('1.234 sonuç')).toBeInTheDocument()
    expect(screen.getByText('“nolan” için sonuçlar')).toBeInTheDocument()
  })

  it('TR+EN birleşimi id üzerinden dedupe eder (TR tercihli)', async () => {
    renderSearch('/search?q=nolan')
    await screen.findAllByRole('link')
    // id=1'in EN kopyası (Inception) atılır; EN'e özgü id=2 (Interstellar) eklenir.
    expect(screen.queryAllByText('Inception')).toHaveLength(0)
    expect(screen.getAllByText('Interstellar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zift').length).toBeGreaterThan(0)
  })

  it('kategori sekmesi URL senkronudur ve sonuçları değiştirir', async () => {
    const user = userEvent.setup()
    renderSearch('/search?q=nolan')
    await screen.findByText('1.234 sonuç')

    await user.click(screen.getByRole('tab', { name: 'Dizi' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/search?q=nolan&category=tv'),
    )
    expect(await screen.findByText('300 sonuç')).toBeInTheDocument()
    expect(screen.getAllByText('Breaking Bad').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Kişi' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/search?q=nolan&category=person'),
    )
    expect(screen.getAllByText('Tom Hanks').length).toBeGreaterThan(0)
  })

  it('sayfalama URL senkronudur (defect K) ve sayfayı değiştirir', async () => {
    const user = userEvent.setup()
    renderSearch('/search?q=nolan')
    await screen.findByText('1.234 sonuç')

    await user.click(screen.getByRole('button', { name: '2' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/search?q=nolan&page=2'),
    )
    expect(screen.getByRole('button', { name: 'Önceki sayfa' })).toBeEnabled()
  })

  it("boş sonuçlarda öneriler + Keşfet'e geçiş gösterir", async () => {
    queryState.multi = emptyMulti
    queryState.multiEN = emptyMulti
    renderSearch('/search?q=zzzz')
    expect(await screen.findByText('Sonuç bulunamadı')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: "Gelişmiş keşfetme için Keşfet'e geç" }),
    ).toHaveAttribute('href', '/kesfet')
    // Kompakt trend önerisi
    expect(await screen.findAllByText('Trend Film')).toBeTruthy()
  })

  it('paylaşılan URL kategori + sayfayı doğrudan açar', async () => {
    renderSearch('/search?q=nolan&category=movie&page=2')
    expect(await screen.findByText('900 sonuç')).toBeInTheDocument()
    expect(screen.getByTestId('location-probe').textContent).toBe('/search?q=nolan&category=movie&page=2')
    expect(screen.getByRole('tab', { name: 'Film' })).toHaveAttribute('aria-selected', 'true')
  })
})
