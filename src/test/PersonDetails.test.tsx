/**
 * PersonDetails (Cinematic Atlas §6 Person) — profil hero, bilgi paneli,
 * biyografi genişletme, kredi sekmeleri ve bağlantı hedefleri.
 * API katmanı mock'lanır (endpoint modülü).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { PersonDetailFull } from '@components/Persons/personCredits'

// --- Mock state (lazy-evaluated by the factory below) -------------------------

const personState: {
  data?: PersonDetailFull | undefined
  isLoading: boolean
  error?: { status: number | string } | undefined
  refetch: ReturnType<typeof vi.fn>
} = {
  isLoading: false,
  refetch: vi.fn(),
}

vi.mock('@api/endpoints/persons.endpoints', () => ({
  useGetPersonDetailsQuery: () => personState,
}))

vi.mock('@components/MediaGallery/MediaGallery', () => ({
  default: () => <div data-testid="media-gallery" />,
}))

import PersonDetails from '@pages/Persons/PersonDetails'

// --- Fixtures -----------------------------------------------------------------

const LONG_BIO =
  'William Bradley Pitt, Amerikalı oyuncu ve yapımcı. '.repeat(20) +
  'Kariyeri boyunca iki Oscar adaylığı kazandı ve Fight Club, Ocean’s Eleven gibi filmlerde rol aldı.'

const movieCastCredit = {
  adult: false,
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  genre_ids: [18],
  original_language: 'en',
  overview: '',
  popularity: 61.2,
  poster_path: '/fight.jpg',
  release_date: '1999-10-15',
  video: false,
  vote_average: 8.4,
  vote_count: 27000,
  character: 'Tyler Durden',
  credit_id: 'c-movie-cast',
  order: 1,
}

const movieCrewCredit = {
  ...movieCastCredit,
  id: 12,
  title: 'Ejderhayı Öldürmek',
  popularity: 4.1,
  release_date: '2007-05-22',
  character: undefined,
  credit_id: 'c-movie-crew',
  job: 'Director',
  department: 'Directing',
}

const tvCastCredit = {
  adult: false,
  id: 31,
  name: 'Growing Pains',
  original_name: 'Growing Pains',
  genre_ids: [35],
  origin_country: ['US'],
  original_language: 'en',
  overview: '',
  popularity: 12.5,
  poster_path: '/gp.jpg',
  first_air_date: '2015-01-01',
  vote_average: 7.1,
  vote_count: 300,
  character: 'Jeffrey',
  credit_id: 'c-tv-cast',
  episode_count: 4,
}

const person: PersonDetailFull = {
  birthday: '1963-12-18',
  known_for_department: 'Acting',
  deathday: undefined,
  id: 287,
  name: 'Brad Pitt',
  also_known_as: ['William Bradley Pitt'],
  gender: 2,
  biography: LONG_BIO,
  popularity: 30,
  place_of_birth: 'Shawnee, Oklahoma, ABD',
  profile_path: '/brad.jpg',
  adult: false,
  imdb_id: 'nm0000093',
  homepage: null,
  movie_credits: { cast: [movieCastCredit], crew: [movieCrewCredit] },
  tv_credits: { cast: [tvCastCredit], crew: [] },
  external_ids: {
    imdb_id: 'nm0000093',
    instagram_id: 'bradpittofficial',
    twitter_id: 'bradpitt',
    facebook_id: null,
  },
}

function renderPersonDetails() {
  return render(
    <MemoryRouter initialEntries={['/person/287']}>
      <Routes>
        <Route path="/person/:cast_id" element={<PersonDetails />} />
        <Route path="/person" element={<div>Popüler Kişiler</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  personState.data = person
  personState.isLoading = false
  personState.error = undefined
  personState.refetch = vi.fn()
  document.title = ''
})

describe('PersonDetails', () => {
  it('profil bilgilerini (isim, doğum, doğum yeri, bilinen alan) gösterir', () => {
    renderPersonDetails()

    expect(screen.getByRole('heading', { level: 1, name: 'Brad Pitt' })).toBeInTheDocument()
    // Bilinen alan: department etiketi çevrilir (chip + kredi grubu başlığı)
    expect(screen.getAllByText('Oyunculuk').length).toBeGreaterThanOrEqual(1)
    // Doğum tarihi tr-TR uzun format
    expect(screen.getByText(/18 Aralık 1963/)).toBeInTheDocument()
    expect(screen.getByText(/yaşında/)).toBeInTheDocument()
    // Doğum yeri ham veri
    expect(screen.getByText('Shawnee, Oklahoma, ABD')).toBeInTheDocument()
    // SEO
    expect(document.title).toBe('Brad Pitt · LMDB')
  })

  it('vefat bilgisi varsa yaş aralığını gösterir', () => {
    personState.data = {
      ...person,
      birthday: '1930-08-25',
      deathday: '2016-12-28',
    }
    renderPersonDetails()

    expect(screen.getByText(/25 Ağustos 1930/)).toBeInTheDocument()
    expect(screen.getByText(/28 Aralık 2016/)).toBeInTheDocument()
    expect(screen.getByText(/86 yaşında vefat etti/)).toBeInTheDocument()
  })

  it('uzun biyografiyi "Devamını oku" ile açıp kapatır', async () => {
    const user = userEvent.setup()
    renderPersonDetails()

    const expand = screen.getByRole('button', { name: 'Devamını oku' })
    await user.click(expand)
    expect(screen.getByRole('button', { name: 'Daha az göster' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Daha az göster' }))
    expect(screen.getByRole('button', { name: 'Devamını oku' })).toBeInTheDocument()
  })

  it('harici bağlantıları (IMDb, Instagram, X, TMDB) resmî URL ile verir', () => {
    renderPersonDetails()

    const imdb = screen.getByRole('link', { name: /IMDb/ })
    expect(imdb).toHaveAttribute('href', 'https://www.imdb.com/name/nm0000093')
    expect(screen.getByRole('link', { name: /Instagram/ })).toHaveAttribute(
      'href',
      'https://www.instagram.com/bradpittofficial',
    )
    expect(screen.getByRole('link', { name: /X \(Twitter\)/ })).toHaveAttribute(
      'href',
      'https://twitter.com/bradpitt',
    )
    expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/person/287',
    )
  })

  it('film kredileri doğru media_type linkleriyle listelenir (kadro + ekip işi)', () => {
    renderPersonDetails()

    // Varsayılan sekme: Filmler
    const moviePanel = screen.getByRole('tabpanel')
    const movieLink = within(moviePanel).getByRole('link', { name: /Fight Club/ })
    expect(movieLink).toHaveAttribute('href', '/movie/550')
    expect(within(moviePanel).getByText(/Tyler Durden rolünde/)).toBeInTheDocument()
    // Ekip işi: job etiketi çevrilir
    expect(within(moviePanel).getByText('Yönetmen')).toBeInTheDocument()
    expect(within(moviePanel).getByRole('link', { name: /Ejderhayı Öldürmek/ })).toHaveAttribute(
      'href',
      '/movie/12',
    )
  })

  it('Diziler sekmesi karakter + bölüm sayısı ile dizi linki verir', async () => {
    const user = userEvent.setup()
    renderPersonDetails()

    await user.click(screen.getByRole('tab', { name: /Diziler/ }))

    const tvPanel = screen.getByRole('tabpanel')
    const tvLink = within(tvPanel).getByRole('link', { name: /Growing Pains/ })
    expect(tvLink).toHaveAttribute('href', '/tv/31')
    expect(within(tvPanel).getByText(/Jeffrey rolünde/)).toBeInTheDocument()
    expect(within(tvPanel).getByText('4 bölüm')).toBeInTheDocument()
  })

  it('sıralama kontrolü "Eski → Yeni" ile kronolojik sıralar', async () => {
    personState.data = {
      ...person,
      movie_credits: {
        cast: [movieCastCredit, { ...movieCastCredit, id: 900, title: 'Eski Film', release_date: '1989-05-05', credit_id: 'c-old' }],
        crew: [],
      },
      tv_credits: undefined,
    }
    const user = userEvent.setup()
    renderPersonDetails()

    await user.click(screen.getByRole('button', { name: 'Yıl · Eski → Yeni' }))

    const links = within(screen.getByRole('tabpanel'))
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((href): href is string => Boolean(href?.startsWith('/movie/')))
    expect(links[0]).toBe('/movie/900')
    expect(links[1]).toBe('/movie/550')
  })

  it('En Bilinen İşler rayı popülerliğe göre işleri gösterir', () => {
    renderPersonDetails()

    expect(screen.getByText('En Bilinen İşler')).toBeInTheDocument()
    // Ray + kredi satırı: aynı iş en az iki bağlantıyla temsil edilir
    const fightClubLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/movie/550')
    expect(fightClubLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('yükleme durumunda iskelet gösterir (spinnersız)', () => {
    personState.isLoading = true
    personState.data = undefined
    const { container } = renderPersonDetails()

    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Devamını oku' })).not.toBeInTheDocument()
  })

  it('API hatasında ErrorState + tekrar dene verir', async () => {
    personState.error = { status: 500 }
    const user = userEvent.setup()
    renderPersonDetails()

    expect(screen.getByText('Kişi yüklenemedi')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: 'Tekrar dene' })
    await user.click(retry)
    await waitFor(() => expect(personState.refetch).toHaveBeenCalled())
  })

  it('404 hatasında kişi bulunamadı sayfası gösterir', () => {
    personState.error = { status: 404 }
    renderPersonDetails()

    expect(screen.getByText('Kişi bulunamadı')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Popüler Kişiler' })).toHaveAttribute('href', '/person')
  })
})
