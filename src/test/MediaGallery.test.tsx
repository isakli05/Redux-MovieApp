/**
 * MediaGallery (Cinematic Atlas) — render, Türkçe etiketler, erişilebilirlik,
 * lightbox ve video modalı davranışları. API katmanı mock'lanır.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ImagesResponse, TMDBImage } from '../types/media'
import type { Video, VideosResponse } from '../types/videos'

// --- Mock state (lazy-evaluated by the factories below) ------------------------

const galleryState: {
  images?: ImagesResponse | undefined
  videos?: VideosResponse | undefined
} = {}

const emptyResult = { data: undefined, isLoading: false, error: undefined }

vi.mock('@api/endpoints/media.endpoints', () => ({
  useGetMovieImagesQuery: (_id: string, opts?: { skip?: boolean }) =>
    opts?.skip || !galleryState.images ? emptyResult : { ...emptyResult, data: galleryState.images },
  useGetTVImagesQuery: () => emptyResult,
  useGetSeasonImagesQuery: () => emptyResult,
  useGetPersonImagesQuery: () => emptyResult,
}))

vi.mock('@api/endpoints/movies.endpoints', () => ({
  useGetMovieVideosQuery: (_id: string, opts?: { skip?: boolean }) =>
    opts?.skip || !galleryState.videos ? emptyResult : { ...emptyResult, data: galleryState.videos },
}))

vi.mock('@api/endpoints/tv.endpoints', () => ({
  useGetTVShowVideosQuery: () => emptyResult,
  useGetSeasonVideosQuery: () => emptyResult,
}))

import MediaGallery from '@components/MediaGallery/MediaGallery'

/** Toolbar count renders as `<span>2</span> görsel` — match on combined textContent. */
const getByCountText = (expected: string) =>
  screen.getByText((_, element) => element?.textContent === expected)

// --- Fixtures ------------------------------------------------------------------

const poster = (overrides: Partial<TMDBImage>): TMDBImage => ({
  aspect_ratio: 0.667,
  height: 1500,
  iso_639_1: null,
  file_path: '/poster.jpg',
  vote_average: 5.5,
  vote_count: 1,
  width: 1000,
  ...overrides,
})

const images: ImagesResponse = {
  id: 550,
  posters: [
    poster({ file_path: '/tr-poster.jpg', iso_639_1: 'tr', vote_average: 5.5, vote_count: 2 }),
    poster({ file_path: '/no-lang-poster.jpg', iso_639_1: null, vote_average: 9.0, vote_count: 10 }),
  ],
  backdrops: [poster({ file_path: '/backdrop.jpg', aspect_ratio: 1.778, width: 1920, height: 1080 })],
  logos: [],
}

const video = (overrides: Partial<Video>): Video => ({
  iso_639_1: 'tr',
  iso_3166_1: 'TR',
  name: 'Son Fragman',
  key: 'dQw4w9WgXcQ',
  site: 'YouTube',
  size: 1080,
  type: 'Trailer',
  official: true,
  published_at: '2024-01-01',
  id: 'vid-1',
  ...overrides,
})

const videos: VideosResponse = {
  id: 550,
  results: [
    video({}),
    video({ id: 'vid-2', name: 'Kamera Arkası', key: 'abc123', type: 'Behind the Scenes', official: false }),
  ],
}

function renderGallery() {
  return render(<MediaGallery mediaType="movie" id="550" defaultTab="videos" />)
}

beforeEach(() => {
  galleryState.images = images
  galleryState.videos = videos
})

describe('MediaGallery', () => {
  it('başlığı ve Türkçe sekmeleri sayaçlarıyla render eder', () => {
    renderGallery()

    expect(screen.getByRole('heading', { level: 2, name: 'Medya Galerisi' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Medya kategorileri' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Videolar sekmesi' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Posterler sekmesi' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Arka Planlar sekmesi' })).toBeInTheDocument()
    // Sayaçlar görünür durumda (sekme içi rozet)
    expect(within(screen.getByRole('tab', { name: 'Videolar sekmesi' })).getByText('2')).toBeInTheDocument()
  })

  it('aktif sekme aria-selected ile işaretlenir; sekme değişince posterler açılır', async () => {
    const user = userEvent.setup()
    renderGallery()

    const postersTab = screen.getByRole('tab', { name: 'Posterler sekmesi' })
    expect(postersTab).toHaveAttribute('aria-selected', 'false')

    await user.click(postersTab)

    expect(postersTab).toHaveAttribute('aria-selected', 'true')
    // Türkçe alt metinli görseller
    const cards = screen.getAllByRole('button', { name: 'Poster görseli' })
    expect(cards).toHaveLength(2)
    expect(screen.getAllByAltText('Poster görseli')).toHaveLength(2)
    // Araç çubuğu Türkçe
    expect(screen.getByLabelText('Sırala:')).toBeInTheDocument()
    expect(screen.getByLabelText('Dil:')).toBeInTheDocument()
    expect(getByCountText('2 görsel')).toBeInTheDocument()
  })

  it('görsel kartı lightbox açar; Escape ile klavyeden kapatır', async () => {
    const user = userEvent.setup()
    renderGallery()

    await user.click(screen.getByRole('tab', { name: 'Posterler sekmesi' }))
    await user.click(screen.getAllByRole('button', { name: 'Poster görseli' })[0])

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('1 / 2')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kapat' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Önceki görsel' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Sonraki görsel' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Yakınlaştır' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Uzaklaştır' })).toBeInTheDocument()

    // Odak yönetimi: açılınca Kapat düğmesine odaklanır
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Kapat' })).toHaveFocus(),
    )

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lightbox ok tuşlarıyla görseller arası geçiş yapar', async () => {
    const user = userEvent.setup()
    renderGallery()

    await user.click(screen.getByRole('tab', { name: 'Posterler sekmesi' }))
    await user.click(screen.getAllByRole('button', { name: 'Poster görseli' })[0])

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('dil filtresi ve sıralama seçimlerini uygular', async () => {
    const user = userEvent.setup()
    renderGallery()

    await user.click(screen.getByRole('tab', { name: 'Posterler sekmesi' }))
    expect(getByCountText('2 görsel')).toBeInTheDocument()

    // Dil yok filtresi: yalnızca dilsiz poster kalır
    await user.selectOptions(screen.getByLabelText('Dil:'), 'null')
    expect(getByCountText('1 görsel')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Poster görseli' })).toHaveLength(1)

    // Sıralama değişimi çalışır (en çok oy: dilsiz poster başa geçer)
    await user.selectOptions(screen.getByLabelText('Dil:'), 'all')
    await user.selectOptions(screen.getByLabelText('Sırala:'), 'vote_count')
    expect(getByCountText('2 görsel')).toBeInTheDocument()
  })

  it('ızgara/mozaik görünüm anahtarları Türkçe etiketlidir ve çalışır', async () => {
    const user = userEvent.setup()
    const { container } = renderGallery()

    await user.click(screen.getByRole('tab', { name: 'Posterler sekmesi' }))

    const grid = screen.getByRole('button', { name: 'Izgara Görünüm' })
    const masonry = screen.getByRole('button', { name: 'Mozaik Görünüm' })
    expect(grid).toHaveAttribute('aria-pressed', 'true')
    expect(masonry).toHaveAttribute('aria-pressed', 'false')

    await user.click(masonry)

    expect(masonry).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.columns-2')).not.toBeNull()
    expect(container.querySelector('.grid-cols-2')).toBeNull()
  })

  it('video kartı modalı açar, iframe ve Türkçe kontrolleri gösterir, Escape ile kapatır', async () => {
    const user = userEvent.setup()
    renderGallery()

    // Öne çıkan video: ada "oynat" ekiyle erişilebilir ad
    await user.click(screen.getByRole('button', { name: 'Son Fragman oynat' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByTitle('Son Fragman')).toBeInTheDocument()
    expect(within(dialog).getByText('Fragman')).toBeInTheDocument()
    expect(within(dialog).getByText('Resmi')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kapat' })).toBeInTheDocument()

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Kapat' })).toHaveFocus(),
    )

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('medya yokken (boş sekmeler) hiçbir şey render etmez', () => {
    galleryState.images = { id: 550, posters: [], backdrops: [], logos: [] }
    galleryState.videos = { id: 550, results: [] }

    const { container } = renderGallery()

    expect(container).toBeEmptyDOMElement()
  })
})
