/**
 * /movie/now-playing ince sarmalayıcı duman testi — doğru hook etiketleriyle
 * paylaşılan CatalogPage'i kullanır; film alan adları (title/release_date)
 * PosterCard bağlantılarına doğru şekilde akar. Hook mock'lanır.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const nowPlayingState: {
  data: unknown;
} = {
  data: {
    page: 1,
    total_pages: 3,
    total_results: 40,
    results: [
      { id: 101, title: 'Vizyon Filmi 1', poster_path: null, vote_average: 8.1, release_date: '2026-03-01' },
      { id: 102, title: 'Vizyon Filmi 2', poster_path: null, vote_average: 6.9, release_date: '2026-04-15' },
    ],
  },
};

vi.mock('@api/index', () => ({
  useGetNowPlayingMoviesQuery: () => ({
    data: nowPlayingState.data,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

import NowPlaying from '@pages/Movies/NowPlaying';

function renderPage() {
  return render(
    <MemoryRouter>
      <NowPlaying />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  document.title = '';
});

describe('NowPlaying sayfası', () => {
  it('CatalogPage sarmalayıcısı: başlık, sayım, kartlar ve SEO', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Vizyondaki Filmler' })).toBeInTheDocument();
    expect(screen.getByText('Vizyonda')).toBeInTheDocument();
    expect(screen.getByText('40 film')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Vizyon Filmi 1/ })).toHaveAttribute('href', '/movie/101');
    expect(screen.getByRole('link', { name: /Vizyon Filmi 2/ })).toHaveAttribute('href', '/movie/102');

    expect(document.title).toBe('Vizyondaki Filmler · LMDB');
  });
});
