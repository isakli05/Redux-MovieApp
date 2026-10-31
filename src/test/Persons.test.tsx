/**
 * Persons (/person kataloğu) — grid durumları (iskelet/hata/boş), kart
 * bağlantıları, arama yönlendirmesi ve hibrit yükleme davranışı.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { PopularPersons } from '@/types/popularPersons'

const personsState: {
  data?: PopularPersons | undefined
  isLoading: boolean
  isFetching: boolean
  error?: { status: number } | undefined
  refetch: ReturnType<typeof vi.fn>
} = {
  isLoading: false,
  isFetching: false,
  refetch: vi.fn(),
}

vi.mock('@api/endpoints/persons.endpoints', () => ({
  useGetPopularPersonsQuery: () => personsState,
}))

import Persons from '@pages/Persons/Persons'

const makePerson = (id: number, name: string, popularity = 10, knownTitle = 'Fight Club') => ({
  profile_path: `/person-${id}.jpg`,
  adult: false,
  id,
  known_for: [{ id: 550, title: knownTitle, media_type: 'movie' }],
  name,
  popularity,
})

const page1: PopularPersons = {
  page: 1,
  total_results: 41,
  total_pages: 3,
  // known_for girişleri kısmi tutulur (testte yalnızca başlık kullanılır)
  results: [
    makePerson(287, 'Brad Pitt'),
    makePerson(6884, 'Nuri Bilge Ceylan', 4, 'Bir Zamanlar Anadolu’da'),
  ],
} as unknown as PopularPersons

function renderPersons() {
  return render(
    <MemoryRouter initialEntries={['/person']}>
      <Routes>
        <Route path="/person" element={<Persons />} />
        <Route path="/search" element={<div>Arama Sayfası</div>} />
        <Route path="/kesfet" element={<div>Keşfet</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  personsState.data = page1
  personsState.isLoading = false
  personsState.isFetching = false
  personsState.error = undefined
  personsState.refetch = vi.fn()
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
})

describe('Persons sayfası', () => {
  it('kişileri profile kartlarıyla ve doğru linklerle listeler', () => {
    renderPersons()

    expect(screen.getByText('Brad Pitt')).toBeInTheDocument()
    expect(screen.getByText('Nuri Bilge Ceylan')).toBeInTheDocument()
    // known_for_department popular yanıtında yok → bilinen iş başlığı düşer
    expect(screen.getByText('Fight Club')).toBeInTheDocument()

    const bradLink = screen.getByRole('link', { name: /Brad Pitt/ })
    expect(bradLink).toHaveAttribute('href', '/person/287')
    expect(screen.getByRole('img', { name: /Brad Pitt profili/ })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w185/person-287.jpg',
    )
  })

  it('arama kolaylığı global aramaya (kişi kategorisi) yöneltir', () => {
    renderPersons()

    const searchLink = screen.getByRole('link', { name: /Kişi Ara/ })
    expect(searchLink).toHaveAttribute('href', '/search?category=person')
  })

  it('ilk yüklemede iskelet ızgarası gösterir', () => {
    personsState.isLoading = true
    personsState.data = undefined
    const { container } = renderPersons()

    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThanOrEqual(20)
    expect(screen.queryByText('Brad Pitt')).not.toBeInTheDocument()
  })

  it('hatada ErrorState ve tekrar deneme verir', async () => {
    personsState.error = { status: 500 }
    personsState.data = undefined
    const user = userEvent.setup()
    renderPersons()

    expect(screen.getByText('Kişiler yüklenemedi')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    await waitFor(() => expect(personsState.refetch).toHaveBeenCalled())
  })

  it('boş sonuçta EmptyState gösterir', () => {
    personsState.data = { page: 1, total_results: 0, total_pages: 0, results: [] }
    renderPersons()

    expect(screen.getByText('Kişi bulunamadı')).toBeInTheDocument()
    const searchLinks = screen.getAllByRole('link', { name: /Kişi Ara/ })
    expect(searchLinks.length).toBeGreaterThanOrEqual(1)
    expect(searchLinks[0]).toHaveAttribute('href', '/search?category=person')
  })

  it('tüm sayfalar yüklendiğinde liste sonu bilgisi gösterir', () => {
    personsState.data = { ...page1, total_pages: 1 }
    renderPersons()

    expect(screen.getByText('Tüm kişiler görüntülendi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Daha Fazla Yükle/ })).not.toBeInTheDocument()
  })

  it('hibrit yükleme: otomatik sayfalar sonrası "Daha Fazla Yükle" düğmesi sunar', () => {
    // jsdom'da IntersectionObserver yok — sayfa sınırına kadar otomatik
    // yüklemeyi tetikleyen bir sahte observer kur (hem globalThis hem window).
    let instantCallback: ((entries: { isIntersecting: boolean }[]) => void) | undefined
    class MockIntersectionObserver {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        instantCallback = cb
      }
      observe() {
        instantCallback?.([{ isIntersecting: true }])
      }
      disconnect() {}
      unobserve() {}
    }
    const mockObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
    const previous = (globalThis as Record<string, unknown>).IntersectionObserver
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockObserver,
    })
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockObserver,
    })

    try {
      personsState.data = { ...page1, total_pages: 400 }
      renderPersons()

      // İlk 5 sayfa otomatik yüklenir; sonrasında manuel düğme görünür
      const loadMore = screen.getByRole('button', { name: /Daha Fazla Yükle/ })
      expect(loadMore).toBeInTheDocument()
    } finally {
      Object.defineProperty(globalThis, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: previous,
      })
    }
  })
})
