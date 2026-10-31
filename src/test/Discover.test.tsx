/**
 * /kesfet sayfası — URL-stateful filtreler, özet cümle + gerçek sonuç sayısı,
 * aktif filtre çiplerinin tek tek kaldırılması ve URL senkronu.
 * Discover passthrough hook'ları mock'lanır.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const moviePage = (page: number) => ({
  page,
  total_pages: 3,
  total_results: 5432,
  results: [
    { id: 101, title: 'Oppenheimer', poster_path: null, popularity: 90, vote_average: 8.3 },
    { id: 102, title: 'Barbie', poster_path: null, popularity: 88, vote_average: 7.5 },
  ],
})

const tvPage = (page: number) => ({
  page,
  total_pages: 2,
  total_results: 777,
  results: [{ id: 201, name: 'The Last of Us', poster_path: null, popularity: 70, vote_average: 8.7 }],
})

const makeResult = (data: unknown, isLoading = false) => ({
  data,
  isLoading,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
})

const discoverState: { movie: unknown; tv: unknown } = { movie: moviePage(1), tv: tvPage(1) }

vi.mock('@api/index', () => ({
  // Discover.tsx + SearchBar.tsx (formatCount import zinciri) için gereken hook'lar.
  useDiscoverMoviesQuery: (_args: unknown, opts?: { skip?: boolean }) =>
    makeResult(opts?.skip ? undefined : discoverState.movie),
  useDiscoverTVShowsQuery: (_args: unknown, opts?: { skip?: boolean }) =>
    makeResult(opts?.skip ? undefined : discoverState.tv),
  useGetTrendingForSearchQuery: () => makeResult(undefined),
  useSearchMultiQuery: () => makeResult(undefined),
  useSearchMultiENQuery: () => makeResult(undefined),
}))

import Discover from '@pages/Discover'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>
}

function renderDiscover(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/kesfet"
          element={
            <>
              <Discover />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
  discoverState.movie = moviePage(1)
  discoverState.tv = tvPage(1)
})

describe('Discover sayfası', () => {
  it('varsayılan durum: filmler + gerçek sonuç sayısı (tr-TR)', async () => {
    renderDiscover('/kesfet')
    expect(screen.getByRole('heading', { name: 'Keşfet' })).toBeInTheDocument()
    // Filtresiz özet: sadece "filmler".
    expect(await screen.findByText('filmler · 5.432 sonuç')).toBeInTheDocument()
    expect(screen.getAllByText('Oppenheimer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Barbie').length).toBeGreaterThan(0)
  })

  it('tam filtreli URL: özet cümle + aktif çipler', async () => {
    renderDiscover('/kesfet?tur=movie&turler=28,878&yil=2020-2026&puan=7&dil=tr')
    expect(
      await screen.findByText('Aksiyon, Bilim Kurgu filmleri · 2020–2026 · 7+ puan · Türkçe · 5.432 sonuç'),
    ).toBeInTheDocument()

    // Çipler tek tek listelenir.
    expect(screen.getByRole('button', { name: 'Filtreyi kaldır: Aksiyon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtreyi kaldır: Bilim Kurgu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtreyi kaldır: 2020–2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtreyi kaldır: 7+ puan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtreyi kaldır: Türkçe' })).toBeInTheDocument()
  })

  it('çip kaldırmak URL den kaldırır (tek tür)', async () => {
    const user = userEvent.setup()
    renderDiscover('/kesfet?tur=movie&turler=28,878')
    await screen.findAllByText('Oppenheimer')

    await user.click(screen.getByRole('button', { name: 'Filtreyi kaldır: Aksiyon' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/kesfet?tur=movie&turler=878'),
    )
  })

  it('Tür değişimi tur=tv yazar ve tür seçimini sıfırlar', async () => {
    const user = userEvent.setup()
    renderDiscover('/kesfet?tur=movie&turler=28')
    await screen.findAllByText('Oppenheimer')

    await user.click(screen.getByRole('button', { name: /^Dizi$/ }))
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/kesfet?tur=tv'),
    )
    // TV fixture'ı akar.
    expect(await screen.findAllByText('The Last of Us')).toBeTruthy()
    expect(screen.getByText('diziler · 777 sonuç')).toBeInTheDocument()
  })

  it('Temizle tüm filtreleri sıfırlar', async () => {
    const user = userEvent.setup()
    renderDiscover('/kesfet?tur=tv&yil=2020-2026&puan=7')
    await screen.findAllByText('The Last of Us')

    await user.click(screen.getByRole('button', { name: 'Temizle' }))
    // Temizle filtreleri sıfırlar ama tür (Film/Dizi) görünüm seçimini korur.
    await waitFor(() =>
      expect(screen.getByTestId('location-probe').textContent).toBe('/kesfet?tur=tv'),
    )
  })
})
