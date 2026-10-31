/**
 * Keşfet (/kesfet) — URL-stateful gelişmiş keşif sayfası (spec §6 Discover).
 *
 * URL = tek doğruluk kaynağı: `?tur=&turler=&yil=&puan=&dil=&sirala=&page=`
 * (`page` = şu ana kadar yüklenmiş sayfa sayısı). Filtre değişimi push, sayfa
 * yükleme replace ile senkronize edilir (paylaşılabilir bağlantılar).
 *
 * Veri: mevcut discover passthrough hook'ları (useDiscoverMoviesQuery /
 * useDiscoverTVShowsQuery) + src/components/Discover/discoverFilters.ts içinde
 * inşa edilen sorgu parçası. Yeni API dosyası açılmadı.
 *
 * Hibrit yükleme: ilk 5 sayfa IntersectionObserver ile otomatik, sonrasında
 * "Daha fazla yükle" düğmesi.
 *
 * v1 NOTLARI (Wave 4 boşlukları):
 * - `bolum` (watch provider) + `bolge` (watch_region) filtreleri YOK —
 *   providers.endpoints.ts'te ana sağlayıcı listesi endpoint'i yok.
 * - Tür adları statik Türkçe tablodan gelir (genres.ts) — genre listesi
 *   endpoint'i API katmanında yok.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useDiscoverMoviesQuery,
  useDiscoverTVShowsQuery,
} from '@api/index';
import { toMediaSummary } from '@/types/mediaSummary';
import type { MediaSummary, TrendingRawItem } from '@/types/mediaSummary';
import { Button, EmptyState, ErrorState, PosterCard, PosterCardSkeleton } from '@components/ui';
import { useSEO } from '@hooks/useSEO';
import {
  DEFAULT_DISCOVER_FILTERS,
  TMDB_MAX_PAGES,
  filtersToQuery,
  filterSummaryParts,
  parseDiscoverFilters,
  serializeDiscoverFilters,
} from '@components/Discover/discoverFilters';
import type { DiscoverFilterState } from '@components/Discover/discoverFilters';
import { ActiveFilterChips, FilterPanel } from '@components/Discover/FilterPanel';
import { formatCount } from '@components/Search/SearchBar';

const AUTO_LOAD_PAGE_LIMIT = 5;
const SKELETON_COUNT = 12;
const PAGE_CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8';
const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-4 gap-y-8';

/** Şu anki sayfa yanıtı (movie/tv passthrough'ların ortak şekli). */
interface DiscoverPage {
  page: number;
  results: readonly unknown[];
  total_pages: number;
  total_results: number;
}

export default function Discover() {
  useSEO({
    title: 'Keşfet',
    description:
      'Tür, yıl, puan, dil ve sıralamaya göre filmleri ve dizileri keşfedin. Filtreler bağlantıya gömülür, paylaşabilirsiniz.',
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // Filtreler yalnızca URL'den türetilir.
  const filters = useMemo(() => parseDiscoverFilters(searchParams), [searchParams]);
  const loadedPages = Math.max(1, Number(searchParams.get('page')) || 1);

  const watchType = useMemo(() => filtersToQuery(filters), [filters]);
  const querySignature = `${filters.type}:${watchType}`;

  // Koşullu hook çağrısı yerine skip: tür değişince yalnız aktif istek atılır.
  const movieQuery = useDiscoverMoviesQuery(
    { watchType, page: loadedPages },
    { skip: filters.type !== 'movie' },
  );
  const tvQuery = useDiscoverTVShowsQuery(
    { watchType, page: loadedPages },
    { skip: filters.type === 'movie' },
  );
  const activeQuery = filters.type === 'movie' ? movieQuery : tvQuery;
  const activeData = activeQuery.data as DiscoverPage | undefined;

  // Sayfaları biriktir: RTK Query yalnızca son arg'ın verisini tutar, önceki
  // sayfalar bu küçük birikimicide saklanır (imza = tür + sorgu parçası).
  const [accumulator, setAccumulator] = useState<{ signature: string; pages: unknown[][] }>({
    signature: '',
    pages: [],
  });

  useEffect(() => {
    if (!activeData || !Array.isArray(activeData.results)) return;
    setAccumulator((prev) => {
      const pages = prev.signature === querySignature ? [...prev.pages] : [];
      while (pages.length < activeData.page) pages.push([]);
      pages[activeData.page - 1] = activeData.results as unknown[];
      // İleri/geri gezinmede fazlalığı kırp: görünen = 1..sayfa.
      pages.length = activeData.page;
      return { signature: querySignature, pages };
    });
  }, [activeData, querySignature]);

  const items: MediaSummary[] = useMemo(() => {
    if (accumulator.signature !== querySignature) return [];
    return accumulator.pages.flat().map((raw) =>
      toMediaSummary({ ...(raw as TrendingRawItem), media_type: filters.type }),
    );
  }, [accumulator, querySignature, filters.type]);

  const totalPages = activeData ? Math.min(activeData.total_pages, TMDB_MAX_PAGES) : 0;
  const hasMore = totalPages > loadedPages;
  const isInitialLoading = items.length === 0 && activeQuery.isLoading;
  const isFetchingMore = activeQuery.isFetching && items.length > 0;

  // URL güncellemeleri -----------------------------------------------------
  const applyFilters = useCallback(
    (next: DiscoverFilterState, page = 1) => {
      setSearchParams(
        { ...serializeDiscoverFilters(next), ...(page > 1 ? { page: String(page) } : {}) },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const loadMore = useCallback(() => {
    const params = serializeDiscoverFilters(filters);
    setSearchParams({ ...params, page: String(loadedPages + 1) }, { replace: true });
  }, [filters, loadedPages, setSearchParams]);

  // Otomatik yükleme (ilk 5 sayfa): yaklaşan sentinel gözlenir.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoad = loadedPages < AUTO_LOAD_PAGE_LIMIT && hasMore && !activeQuery.isFetching && items.length > 0;

  useEffect(() => {
    if (!canAutoLoad) return;
    const element = sentinelRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [canAutoLoad, loadMore]);

  const summary = filterSummaryParts(filters).join(' · ');
  const totalResults = activeData?.total_results ?? 0;

  return (
    <div className="min-h-screen bg-surface-void">
      <div className={PAGE_CONTAINER}>
        {/* Başlık */}
        <header className="mb-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Keşif</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            Keşfet
          </h1>
          <p className="mt-2 text-sm tabular-nums text-secondary">
            {totalResults > 0 ? `${summary} · ${formatCount(totalResults)} sonuç` : summary}
          </p>
        </header>

        {/* Filtreler + aktif çipler */}
        <FilterPanel state={filters} onChange={applyFilters} />
        <div className="mt-3">
          <ActiveFilterChips state={filters} onChange={applyFilters} />
        </div>

        {/* Sonuçlar */}
        <section aria-label="Keşif sonuçları" className="mt-8">
          {activeQuery.isError ? (
            <ErrorState
              title="Sonuçlar yüklenemedi"
              message="Keşif sonuçları alınırken bir sorun oluştu. Lütfen tekrar deneyin."
              onRetry={activeQuery.refetch}
              backTo="/"
              backLabel="Ana Sayfaya Dön"
            />
          ) : isInitialLoading ? (
            <div className={GRID_CLASS}>
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <PosterCardSkeleton key={index} className="!w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Bu filtrelerle sonuç bulunamadı"
              hint="Yıl aralığını genişletmeyi, puan eşiğini düşürmeyi ya da tür seçimini azaltmayı deneyin."
              action={
                <Button variant="outline" size="sm" onClick={() => applyFilters(DEFAULT_DISCOVER_FILTERS)}>
                  Filtreleri Temizle
                </Button>
              }
            />
          ) : (
            <>
              <div className={GRID_CLASS}>
                {items.map((item) => (
                  <PosterCard
                    key={`${item.media_type}-${item.id}`}
                    item={item}
                    className="!w-full"
                    showMediaType={false}
                  />
                ))}
              </div>

              {/* Hibrit yükleme: 5 sayfaya kadar otomatik, sonra düğme */}
              {hasMore ? (
                <div className="mt-10 flex flex-col items-center gap-3" ref={sentinelRef}>
                  {isFetchingMore && (
                    <p role="status" className="text-sm text-secondary">
                      Yükleniyor…
                    </p>
                  )}
                  {loadedPages >= AUTO_LOAD_PAGE_LIMIT && (
                    <Button variant="outline" onClick={loadMore} loading={isFetchingMore}>
                      Daha fazla yükle
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-10 text-center text-sm text-muted">
                  Tüm sonuçlar listelendi.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
