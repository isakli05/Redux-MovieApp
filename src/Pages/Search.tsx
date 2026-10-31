/**
 * Arama sonuçları sayfası (/search) — Cinematic Atlas spec §6 Search.
 *
 * URL-stateful: `?q=&category=all|movie|tv|person&page=` (paylaşılabilir).
 * Gerçek API `total_results` sayıları tr-TR biçimde gösterilir (defect L fix)
 * ve numaralı sayfalama URL'e senkron çalışır (defect K fix).
 *
 * TR + EN birleşik sorgulama korunur: multi/film/dizi kategorilerinde iki dil
 * birlikte istenir, sonuçlar id üzerinden dedupe edilir (TR tercihli). Kişi
 * kategorisi `/search/person` (TR) kullanır — kişi adları TMDB'de çevrilmez,
 * ikinci bir dil isteği gereksizdir (bkz. TMDB_CAPABILITIES.md).
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  useGetTrendingForSearchQuery,
  useSearchMoviesENQuery,
  useSearchMoviesQuery,
  useSearchMultiENQuery,
  useSearchMultiQuery,
  useSearchPersonsQuery,
  useSearchTVShowsENQuery,
  useSearchTVShowsQuery,
} from '@api/index';
import {
  Button,
  EmptyState,
  ErrorState,
  PosterCard,
  PosterCardSkeleton,
  Tabs,
} from '@components/ui';
import {
  formatCount,
  mergeSearchResults,
  mergedTotalPages,
  mergedTotalResults,
} from '@components/Search/SearchBar';
import { PaginationNav } from '@components/Discover/PaginationNav';
import { useSEO } from '@hooks/useSEO';
import { toMediaSummary } from '@/types/mediaSummary';
import type { MediaSummary } from '@/types/mediaSummary';
import type { MultiSearchItem, SearchCategory } from '@/types/search';

/** Arama sayfası için minimum sorgu uzunluğu (SearchBar submit eşiğiyle aynı). */
const MIN_QUERY_LENGTH = 2;
const SKELETON_COUNT = 12;
const PAGE_CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8';
const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-4 gap-y-8';

const CATEGORY_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'movie', label: 'Film' },
  { id: 'tv', label: 'Dizi' },
  { id: 'person', label: 'Kişi' },
];

const isCategory = (value: string | null): value is SearchCategory =>
  value === 'movie' || value === 'tv' || value === 'person';

/** `/search/{movie,tv}` ham sonucunu multi şekline taşır (media_type ekler). */
const asMultiPage = <T extends object>(
  results: readonly T[] | undefined,
  mediaType: 'movie' | 'tv',
): { results: MultiSearchItem[] } | undefined =>
  results
    ? {
        results: results.map(
          (raw) => ({ ...raw, media_type: mediaType }) as unknown as MultiSearchItem,
        ),
      }
    : undefined;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tek doğruluk kaynağı URL'dir.
  const query = (searchParams.get('q') ?? '').trim();
  const categoryParam = searchParams.get('category');
  const category: SearchCategory = isCategory(categoryParam) ? categoryParam : 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  useSEO({
    title: query ? `“${query}” için arama sonuçları` : 'Arama',
    description: query
      ? `LMDB'de “${query}” için film, dizi ve kişi arama sonuçları.`
      : `LMDB'de film, dizi ve kişi arayın.`,
  });

  const minQuery = query.length >= MIN_QUERY_LENGTH;

  // TR + EN çiftleri; yalnızca aktif kategorinin sorguları atılır.
  const skipAll = !minQuery || category !== 'all';
  const skipMovie = !minQuery || category !== 'movie';
  const skipTv = !minQuery || category !== 'tv';
  const skipPerson = !minQuery || category !== 'person';

  const multiTR = useSearchMultiQuery({ query, page }, { skip: skipAll });
  const multiEN = useSearchMultiENQuery({ query, page }, { skip: skipAll });
  const moviesTR = useSearchMoviesQuery({ query, page }, { skip: skipMovie });
  const moviesEN = useSearchMoviesENQuery({ query, page }, { skip: skipMovie });
  const tvTR = useSearchTVShowsQuery({ query, page }, { skip: skipTv });
  const tvEN = useSearchTVShowsENQuery({ query, page }, { skip: skipTv });
  const persons = useSearchPersonsQuery({ query, page }, { skip: skipPerson });

  // Kategoriye göre birleşim + GERÇEK toplamlar (defect L).
  const { items, totalResults, totalPages, isLoading, isFetching, isError, refetch } =
    useMemo(() => {
      if (category === 'person') {
        const mapped: MultiSearchItem[] = (persons.data?.results ?? []).map((raw) => ({
          ...raw,
          media_type: 'person' as const,
        }));
        return {
          items: mapped,
          totalResults: persons.data?.total_results ?? 0,
          totalPages: Math.min(500, persons.data?.total_pages ?? 0),
          isLoading: persons.isLoading,
          isFetching: persons.isFetching,
          isError: persons.isError,
          refetch: persons.refetch,
        };
      }

      const tr = multiTR.data;
      const en = multiEN.data;
      const trMovie = moviesTR.data;
      const enMovie = moviesEN.data;
      const trTv = tvTR.data;
      const enTv = tvEN.data;

      const merged =
        category === 'movie'
          ? mergeSearchResults(
              trMovie ? asMultiPage(trMovie.results, 'movie') : undefined,
              enMovie ? asMultiPage(enMovie.results, 'movie') : undefined,
            )
          : category === 'tv'
            ? mergeSearchResults(
                trTv ? asMultiPage(trTv.results, 'tv') : undefined,
                enTv ? asMultiPage(enTv.results, 'tv') : undefined,
              )
            : mergeSearchResults(tr, en);

      const pair =
        category === 'movie'
          ? { tr: moviesTR, en: moviesEN }
          : category === 'tv'
            ? { tr: tvTR, en: tvEN }
            : { tr: multiTR, en: multiEN };

      return {
        items: merged,
        totalResults: mergedTotalResults(pair.tr.data, pair.en.data),
        totalPages: mergedTotalPages(pair.tr.data, pair.en.data),
        isLoading: pair.tr.isLoading || pair.en.isLoading,
        isFetching: pair.tr.isFetching || pair.en.isFetching,
        isError: pair.tr.isError && pair.en.isError,
        refetch: pair.tr.refetch,
      };
    }, [
      category,
      multiTR,
      multiEN,
      moviesTR,
      moviesEN,
      tvTR,
      tvEN,
      persons,
    ]);

  // PosterCard'e MediaSummary olarak akıtılır (person → profil kartı).
  const summaries = useMemo(
    () => items.map((item) => toMediaSummary(item)),
    [items],
  );

  // URL yazma: temiz URL'ler için varsayılan değerler (all/1) yazılmaz.
  const writeParams = (nextCategory: SearchCategory, nextPage: number) => {
    const params: Record<string, string> = { q: query };
    if (nextCategory !== 'all') params.category = nextCategory;
    if (nextPage > 1) params.page = String(nextPage);
    setSearchParams(params);
    window.scrollTo({ top: 0 });
  };

  // Boş sorgu: yönlendirme yerine yönlendirici boş durum.
  if (!query) {
    return (
      <div className="min-h-screen bg-surface-void">
        <div className={PAGE_CONTAINER}>
          <EmptyState
            icon={<MagnifyingGlassIcon className="h-10 w-10" />}
            title="Aramak için bir şey yazın"
            hint="Üstteki arama düğmesini ya da ⌘K kısayolunu kullanarak film, dizi ve kişi arayabilirsiniz."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button to="/kesfet">Keşfet'e Git</Button>
                <Button variant="ghost" to="/">
                  Ana Sayfa
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-void">
      <div className={PAGE_CONTAINER}>
        {/* Başlık + gerçek sonuç sayısı (defect L) */}
        <header className="mb-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Arama</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-primary md:text-3xl">
            “{query}” için sonuçlar
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {minQuery && !isLoading ? (
              <>
                <span className="tabular-nums font-medium text-primary">
                  {formatCount(totalResults)} sonuç
                </span>
                {totalPages > 1 && (
                  <span className="tabular-nums">
                    {' '}
                    · {page}. sayfa / {totalPages}
                  </span>
                )}
              </>
            ) : (
              'Sonuçlar yükleniyor…'
            )}
          </p>
        </header>

        {/* Kategori sekmeleri */}
        <Tabs
          tabs={CATEGORY_TABS}
          activeId={category}
          onChange={(id) => writeParams(id as SearchCategory, 1)}
          aria-label="Sonuç kategorileri"
          className="mb-6"
        />

        {/* Sonuçlar */}
        {isError ? (
          <ErrorState
            title="Arama sonuçları yüklenemedi"
            message="TMDB'ye ulaşırken bir sorun oluştu. Lütfen tekrar deneyin."
            onRetry={refetch}
            backTo="/"
            backLabel="Ana Sayfaya Dön"
          />
        ) : isLoading && summaries.length === 0 ? (
          <div className={GRID_CLASS}>
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <PosterCardSkeleton key={index} className="!w-full" />
            ))}
          </div>
        ) : summaries.length === 0 && !isFetching ? (
          <SearchEmpty query={query} />
        ) : (
          <>
            <div className={GRID_CLASS}>
              {summaries.map((item: MediaSummary) => (
                <PosterCard
                  key={`${item.media_type}-${item.id}`}
                  item={item}
                  className="!w-full"
                  showMediaType={category === 'all'}
                />
              ))}
            </div>

            {/* Numaralı sayfalama (defect K) — URL senkron */}
            <PaginationNav
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => writeParams(category, next)}
              className="mt-10"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Boş sonuç durumu: öneriler (kompakt trend şeridi) + Keşfet'e geçiş. */
function SearchEmpty({ query }: { query: string }) {
  const { data: trending } = useGetTrendingForSearchQuery();
  const suggestions = useMemo(
    () =>
      (trending?.results ?? [])
        .slice(0, 8)
        .map((item) => toMediaSummary(item)),
    [trending],
  );

  return (
    <div>
      <EmptyState
        icon={<MagnifyingGlassIcon className="h-10 w-10" />}
        title="Sonuç bulunamadı"
        hint={`“${query}” için hiçbir film, dizi veya kişi bulunamadı. Yazımı kontrol edin ya da daha genel bir terim deneyin.`}
        action={
          <Button to="/kesfet" variant="outline" size="sm">
            Gelişmiş keşfetme için Keşfet'e geç
          </Button>
        }
      />

      {suggestions.length > 0 && (
        <section aria-label="Öneriler" className="mt-4 border-t border-line pt-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
            Bunlara da göz atın
          </h2>
          <div className="flex flex-wrap gap-4">
            {suggestions.map((item) => (
              <PosterCard key={`${item.media_type}-${item.id}`} item={item} size="sm" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
