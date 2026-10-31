/**
 * Paylaşılan CatalogPage bileşeni — başlık/sayım, ızgara durumları (iskelet,
 * hata, boş), hibrit yüklemenin biriktirmesi (replace-on-load-more gerileme
 * testi) ve resetKey değişiminde sıfırlama.
 *
 * Veri kaynağı sahte bir hook: CatalogPage hook'u prop olarak aldığı için
 * RTK Query mock'lamaya gerek yok.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../CatalogPage';
import type { CatalogQueryResult, CatalogRawItem, CatalogPageData } from '../CatalogPage';

// ---------------------------------------------------------------------------
// Sahte sayfalı veri kaynağı
// ---------------------------------------------------------------------------

const movieItem = (id: number, title: string): CatalogRawItem => ({
  id,
  title,
  poster_path: null,
  vote_average: 7.2,
  release_date: '2024-05-03',
});

const pageOf = (page: number, titles: string[], totalPages: number, totalResults: number): CatalogPageData => ({
  page,
  results: titles.map((title, index) => movieItem(page * 100 + index + 1, title)),
  total_pages: totalPages,
  total_results: totalResults,
});

function makeHarness(initialPages: Map<number, CatalogPageData>) {
  const state = {
    pages: new Map(initialPages),
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
    requestedPages: [] as number[],
  };

  const usePageQuery = (page: number): CatalogQueryResult => {
    state.requestedPages.push(page);
    return {
      data: state.pages.get(page),
      isLoading: state.isLoading,
      isFetching: state.isFetching,
      isError: state.isError,
      refetch: state.refetch,
    };
  };

  return { state, usePageQuery };
}

function renderCatalog(usePageQuery: (page: number) => CatalogQueryResult, resetKey?: string) {
  return render(
    <MemoryRouter>
      <CatalogPage
        eyebrow="Vizyonda"
        title="Vizyondaki Filmler"
        description="Test açıklaması"
        mediaType="movie"
        usePageQuery={usePageQuery}
        resetKey={resetKey}
      />
    </MemoryRouter>,
  );
}

/** jsdom'da IntersectionObserver yok — gözlemlediği anda tetikleyen sahte. */
function installInstantIntersectionObserver() {
  let instantCallback: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  class MockIntersectionObserver {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      instantCallback = cb;
    }
    observe() {
      instantCallback?.([{ isIntersecting: true }]);
    }
    disconnect() {}
    unobserve() {}
  }
  const mock = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  const previous = (globalThis as Record<string, unknown>).IntersectionObserver;
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mock,
  });
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mock,
  });
  return () => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: previous,
    });
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogPage', () => {
  it('başlık bloğunu (eyebrow, Fraunces başlık, açıklama, sayım) ve kartları render eder', () => {
    const { usePageQuery } = makeHarness(
      new Map([[1, pageOf(1, ['Vizyon Filmi 1', 'Vizyon Filmi 2'], 6, 40)]]),
    );
    renderCatalog(usePageQuery);

    expect(screen.getByRole('heading', { name: 'Vizyondaki Filmler' })).toBeInTheDocument();
    expect(screen.getByText('Vizyonda')).toBeInTheDocument();
    expect(screen.getByText('Test açıklaması')).toBeInTheDocument();
    expect(screen.getByText('40 film')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Vizyon Filmi 1/ });
    expect(link).toHaveAttribute('href', '/movie/101');
    expect(screen.getByRole('link', { name: /Vizyon Filmi 2/ })).toHaveAttribute('href', '/movie/102');
  });

  it('ilk yüklemede iskelet ızgarası gösterir', () => {
    const { state, usePageQuery } = makeHarness(new Map());
    state.isLoading = true;
    const { container } = renderCatalog(usePageQuery);

    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThanOrEqual(12);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vizyondaki Filmler' })).toBeInTheDocument();
  });

  it('hatada ErrorState gösterir ve tekrar deneme refetch çağırır', async () => {
    const { state, usePageQuery } = makeHarness(new Map([[1, pageOf(1, ['X Filmi'], 6, 40)]]));
    state.isError = true;
    state.pages.clear();
    const user = userEvent.setup();
    renderCatalog(usePageQuery);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Film listesi yüklenemedi')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    await waitFor(() => expect(state.refetch).toHaveBeenCalled());
  });

  it('boş sonuçta EmptyState gösterir (Türkçe kopya)', () => {
    const { usePageQuery } = makeHarness(
      new Map([[1, { page: 1, results: [], total_pages: 0, total_results: 0 }]]),
    );
    renderCatalog(usePageQuery);

    expect(screen.getByText('Film bulunamadı')).toBeInTheDocument();
    expect(
      screen.getByText('Bu listede şu anda film yok. Lütfen daha sonra tekrar deneyin.'),
    ).toBeInTheDocument();
  });

  it('hibrit yükleme: ilk 5 sayfa otomatik, sonrasında düğme; sayfalar BİRİKİR (replace hatası düzeltildi)', async () => {
    const restore = installInstantIntersectionObserver();
    try {
      const pages = new Map<number, CatalogPageData>();
      for (let p = 1; p <= 6; p += 1) {
        pages.set(p, pageOf(p, [`Sayfa ${p} Filmi`], 6, 120));
      }
      const { state, usePageQuery } = makeHarness(pages);
      renderCatalog(usePageQuery);

      // İlk 5 sayfa otomatik yüklenir; manuel düğme görünür.
      const loadMore = screen.getByRole('button', { name: /Daha Fazla Yükle/ });
      expect(loadMore).toBeInTheDocument();
      expect(state.requestedPages).toContain(5);
      expect(state.requestedPages).not.toContain(6);

      // Sayfa 1 öğesi hâlâ ızgarada (eski sayfalarda sayfa değişimi siliyordu).
      expect(screen.getByRole('link', { name: /Sayfa 1 Filmi/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sayfa 5 Filmi/ })).toBeInTheDocument();

      // Manuel yükleme: sayfa 6 eklenir, öncekiler korunur.
      const user = userEvent.setup();
      await user.click(loadMore);
      expect(await screen.findByRole('link', { name: /Sayfa 6 Filmi/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sayfa 1 Filmi/ })).toBeInTheDocument();

      // Tüm sayfalar bitti: liste sonu + başa dön.
      expect(screen.getByText('Tüm filmler görüntülendi')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Başa Dön' })).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('resetKey değişince birikim ve sayfa sıfırlanır', async () => {
    const restore = installInstantIntersectionObserver();
    try {
      // Anahtar A: 2 sayfa → otomatik yükleyerek ikisini de biriktirir.
      const harnessA = makeHarness(
        new Map([
          [1, pageOf(1, ['Anahtar A Filmi 1'], 2, 2)],
          [2, pageOf(2, ['Anahtar A Filmi 2'], 2, 2)],
        ]),
      );
      const harnessB = makeHarness(new Map([[1, pageOf(1, ['Anahtar B Filmi 1'], 1, 1)]]));

      const view = renderCatalog(harnessA.usePageQuery, 'anahtar-a');
      expect(await screen.findByRole('link', { name: /Anahtar A Filmi 2/ })).toBeInTheDocument();

      // Aynı bileşen, yeni anahtar + yeni veri kaynağı.
      view.rerender(
        <MemoryRouter>
          <CatalogPage
            eyebrow="Anahtar Kelime"
            title="Anahtar Filmleri"
            mediaType="movie"
            usePageQuery={harnessB.usePageQuery}
            resetKey="anahtar-b"
          />
        </MemoryRouter>,
      );

      expect(await screen.findByRole('link', { name: /Anahtar B Filmi 1/ })).toBeInTheDocument();
      expect(screen.queryByText(/Anahtar A Filmi/)).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
