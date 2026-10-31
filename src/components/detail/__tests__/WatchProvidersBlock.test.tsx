import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WatchProvidersMap } from '@api/endpoints/providers.endpoints'

const { regionState } = vi.hoisted(() => ({
  regionState: {
    region: 'TR',
    setRegion: vi.fn(),
    regions: [
      { iso_3166_1: 'TR', english_name: 'Turkey', native_name: 'Türkiye' },
      { iso_3166_1: 'US', english_name: 'United States of America', native_name: '' },
    ],
  },
}))

vi.mock('@hooks/useRegion', () => ({
  useRegion: () => regionState,
}))

const { providersState } = vi.hoisted(() => ({
  providersState: { data: undefined as WatchProvidersMap | undefined, isLoading: false },
}))

vi.mock('@api/endpoints/providers.endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/endpoints/providers.endpoints')>()
  return {
    ...actual,
    useGetWatchProvidersQuery: () => providersState,
  }
})

import { WatchProvidersBlock } from '../WatchProvidersBlock'

const provider = (id: number, name: string) => ({
  provider_id: id,
  provider_name: name,
  display_priority: id,
  logo_path: `/logo${id}.png`,
})

const block = (
  flatrate: ReturnType<typeof provider>[] = [],
  rent: ReturnType<typeof provider>[] = [],
  buy: ReturnType<typeof provider>[] = [],
  ads: ReturnType<typeof provider>[] = [],
  free: ReturnType<typeof provider>[] = []
) => ({
  link: 'https://www.themoviedb.org/watch/tr',
  flatrate,
  rent,
  buy,
  ads,
  free,
})

describe('WatchProvidersBlock', () => {
  beforeEach(() => {
    regionState.region = 'TR'
    regionState.setRegion = vi.fn()
    providersState.data = undefined
    providersState.isLoading = false
  })

  it('renders hidden while loading is not finished as empty (no crash)', () => {
    providersState.isLoading = true
    const { container } = render(<WatchProvidersBlock mediaType="movie" id={603} />)
    expect(container.firstChild).toBeInTheDocument() // skeleton branch
    expect(screen.queryByText('Nerede İzlenir')).not.toBeInTheDocument()
  })

  it('renders nothing when the region block is missing or fully empty', () => {
    providersState.data = { US: block([provider(8, 'Netflix')]) }
    const { container } = render(<WatchProvidersBlock mediaType="movie" id={603} />)
    expect(container.firstChild).toBeNull()

    providersState.data = { TR: block() }
    const again = render(<WatchProvidersBlock mediaType="movie" id={603} />)
    expect(again.container.firstChild).toBeNull()
  })

  it('groups providers with Turkish labels and links them to the block link', () => {
    providersState.data = {
      TR: block([provider(8, 'Netflix')], [provider(2, 'Apple TV')], [], [provider(337, 'BluTV Yerel')], [provider(462, 'TRT İzle')]),
    }
    render(<WatchProvidersBlock mediaType="tv" id={1399} />)

    expect(screen.getByText('Abonelik')).toBeInTheDocument()
    expect(screen.getByText('Kiralama')).toBeInTheDocument()
    expect(screen.getByText('Reklamlı')).toBeInTheDocument()
    expect(screen.getByText('Ücretsiz')).toBeInTheDocument()
    // Empty group (Satın Alma) is hidden.
    expect(screen.queryByText('Satın Alma')).not.toBeInTheDocument()

    const netflix = screen.getByAltText('Netflix')
    expect(netflix).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w92/logo8.png')
    expect(netflix.closest('a')).toHaveAttribute('href', 'https://www.themoviedb.org/watch/tr')
    expect(netflix.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('carries the mandatory JustWatch attribution (D7)', () => {
    providersState.data = { TR: block([provider(8, 'Netflix')]) }
    render(<WatchProvidersBlock mediaType="movie" id={603} />)
    expect(screen.getByText('JustWatch', { exact: false })).toHaveAttribute('href', 'https://www.justwatch.com')
  })

  it('offers a region selector that calls setRegion', async () => {
    const user = userEvent.setup()
    providersState.data = {
      TR: block([provider(8, 'Netflix')]),
      US: block([], [provider(350, 'Amazon Video')]),
    }
    render(<WatchProvidersBlock mediaType="movie" id={603} />)

    const select = screen.getByLabelText(/bölge/i)
    expect(select).toHaveValue('TR')
    expect(screen.getByRole('option', { name: 'Türkiye' })).toBeInTheDocument()

    await user.selectOptions(select, 'US')
    expect(regionState.setRegion).toHaveBeenCalledWith('US')
  })
})
