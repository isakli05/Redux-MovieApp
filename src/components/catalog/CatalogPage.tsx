/**
 * Paylaşılan katalog liste sayfası (defect Q — katalog sayfalarındaki kopya
 * kalıbın tek bileşende birleştirilmesi).
 *
 * Sorumluluklar:
 * - Editoryal sayfa başlığı (altın eyebrow + Fraunces h1 + açıklama + sayım),
 * - PosterCard ızgarası (media_type farkında; film/dizi alan adları
 *   toMediaSummary ile normalize edilir),
 * - Hibrit yükleme: ilk 5 sayfa IntersectionObserver ile otomatik, sonrasında
 *   "Daha Fazla Yükle" düğmesi (-spinner),
 * - Sayfalar benzersizce BİRİKTİRİLİR (NowPlaying/Upcoming/AiringToday/OnAir
 *   sayfalarındaki sayfa değişiminde ızgaranın sıfırlanması hatası),
 * - İlk yüklemede iskelet ızgarası, hatada ErrorState + tekrar dene,
 * - Boş sonuçta EmptyState; `resetKey` değişince birikim ve sayfa sıfırlanır.
 *
 * Sayfalar yalnızca doğru RTK Query hook'unu ve Türkçe etiketleri verir;
 * API katmanı olduğu gibi korunur.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toMediaSummary } from '@/types/mediaSummary';
import type { MediaSummary } from '@/types/mediaSummary';
import { Button, EmptyState, ErrorState, PosterCard, PosterCardSkeleton } from '@components/ui';

/** Otomatik yüklenecek azami sayfa sayısı (Netflix tarzı hibrit sınır). */
const AUTO_LOAD_PAGE_LIMIT = 5;
/** DOM'da tutulacak azami kart sayısı (bellek yönetimi — eski /movie,/tv davranışı). */
const MAX_PAGES_IN_MEMORY = 15;
const ITEMS_PER_PAGE = 20;
/** İskelet ızgarası kart sayısı (2/3/4/5/6 kolonlu ızgaralarda tam satırlar). */
const SKELETON_COUNT = 18;

const PAGE_CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8';
const GRID_CLASS = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
const POSTER_SIZES =
  '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16.6vw';

const MEDIA_NOUN: Record<CatalogMediaKind, string> = { movie: 'film', tv: 'dizi' };
const MEDIA_PLURAL: Record<CatalogMediaKind, string> = { movie: 'filmler', tv: 'diziler' };

export type CatalogMediaKind = 'movie' | 'tv';

/** Ham TMDB liste öğesi (movie/tv passthrough yanıtlarının ortak şekli). */
export interface CatalogRawItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  popularity?: number;
}

/** Sayfalı liste yanıtı (Movies/Tvs tipleriyle yapısal olarak uyumlu). */
export interface CatalogPageData {
  page: number;
  results: readonly CatalogRawItem[];
  total_pages: number;
  total_results: number;
}

/** Bileşenin beklediği en küçük sorgu sonucu (RTK Query hook'larıyla uyumlu). */
export interface CatalogQueryResult {
  data?: CatalogPageData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
}

export interface CatalogPageProps {
  /** Fraunces gösterim başlığı. */
  title: string;
  /** Altın eyebrow başlığı (caption, büyük harf). */
  eyebrow: string;
  description?: string;
  /** PosterCard medya tipi + sayım adı (film/dizi). */
  mediaType: CatalogMediaKind;
  /** Sayfalı veri kaynağı; page state'i bileşende kalır. */
  usePageQuery: (page: number) => CatalogQueryResult;
  /** Değişince birikim ve sayfa sıfırlanır (ör. URL'den gelen keyword/network kimliği). */
  resetKey?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorTitle?: string;
  /** Başlığın altına seçmeli içerik (ör. network logosu). */
  headerAside?: ReactNode;
}

/** 1.234 gibi tr-TR biçimli sayı (defect L ile hizalı yerel yardımcı). */
const formatCount = (value: number): string => value.toLocaleString('tr-TR');

export function CatalogPage({
  title,
  eyebrow,
  description,
  mediaType,
  usePageQuery,
  resetKey,
  emptyTitle,
  emptyHint,
  errorTitle,
  headerAside,
}: CatalogPageProps) {
  const resetSignature = resetKey ?? '';
  const signatureRef = useRef(resetSignature);

  const [page, setPage] = useState(1);
  /** Önceki sayfaların geçmişi (RTK Query yalnızca son arg'ın verisini tutar). */
  const [accumulated, setAccumulated] = useState<CatalogRawItem[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = usePageQuery(page);

  // Argüman değişimi: birikimi ve sayfayı sıfırla.
  useEffect(() => {
    if (signatureRef.current === resetSignature) return;
    signatureRef.current = resetSignature;
    setPage(1);
    setAccumulated([]);
  }, [resetSignature]);

  // Görünen sayfayı geçmişe işle (replace-on-load-more düzeltmesi).
  useEffect(() => {
    if (!data?.results) return;
    if (signatureRef.current !== resetSignature) return; // sıfırlama efekti devralır
    setAccumulated((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const fresh = data.results.filter((item) => !existingIds.has(item.id));
      const updated = [...prev, ...fresh];
      const cap = MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE;
      return updated.length > cap ? updated.slice(-cap) : updated;
    });
  }, [data, resetSignature]);

  // Öğeler senkron türetilir: geçmiş + (efektin işlemediği ilk boyamada bile)
  // görünen sayfa. Böylece önbellekten dönüşte boş-durum parlaması olmaz.
  const rawItems: CatalogRawItem[] = useMemo(() => {
    const seen = new Set(accumulated.map((item) => item.id));
    const current = (data?.results ?? []).filter((item) => !seen.has(item.id));
    return [...accumulated, ...current];
  }, [accumulated, data]);

  const items: MediaSummary[] = useMemo(
    () => rawItems.map((raw) => toMediaSummary({ ...raw, media_type: mediaType })),
    [rawItems, mediaType],
  );

  const hasMore = data ? page < data.total_pages : true;

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((prev) => prev + 1);
  }, [hasMore, isFetching]);

  const showInitialSkeleton = isLoading && items.length === 0;
  const isEmpty = !isError && !showInitialSkeleton && !isLoading && items.length === 0;

  // Otomatik yükleme (ilk 5 sayfa): yaklaşan sentinel gözlenir. `!!data`
  // koşulu, yeni sayfa/argüman yüklenirken (data=undefined, hasMore=varsayılan
  // true) sentinel'in bayat değerlerle tetiklenmesini engeller; `page` bağımlılığı
  // gözlemcinin her sayfada yeniden kurulmasını garantiler.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoad =
    hasMore && !!data && !isFetching && items.length > 0 && page < AUTO_LOAD_PAGE_LIMIT;

  useEffect(() => {
    if (!canAutoLoad) return;
    const element = sentinelRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) handleLoadMore();
      },
      { threshold: 0.1, rootMargin: '100px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [canAutoLoad, handleLoadMore, page]);

  const noun = MEDIA_NOUN[mediaType];
  const plural = MEDIA_PLURAL[mediaType];
  const capitalNoun = noun.charAt(0).toLocaleUpperCase('tr-TR') + noun.slice(1);

  return (
    <div className="min-h-screen bg-surface-void">
      <div className={PAGE_CONTAINER}>
        {/* Başlık bloğu */}
        <header className="mb-8">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">{eyebrow}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">{description}</p>
          )}
          {!!data?.total_results && (
            <p className="mt-2 text-sm tabular-nums text-secondary">
              {formatCount(data.total_results)} {noun}
            </p>
          )}
          {headerAside}
        </header>

        {/* Izgara / durumlar */}
        {isError ? (
          <ErrorState
            title={errorTitle ?? `${capitalNoun} listesi yüklenemedi`}
            message={`${capitalNoun} listesi yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.`}
            onRetry={refetch}
            backTo="/kesfet"
            backLabel="Keşfet'e Dön"
          />
        ) : showInitialSkeleton ? (
          <div className={GRID_CLASS}>
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <PosterCardSkeleton key={`skeleton-${index}`} className="!w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            title={emptyTitle ?? `${capitalNoun} bulunamadı`}
            hint={emptyHint ?? `Bu listede şu anda ${noun} yok. Lütfen daha sonra tekrar deneyin.`}
            action={
              <Button variant="outline" size="sm" to="/kesfet">
                Keşfet
              </Button>
            }
          />
        ) : (
          <>
            <div className={GRID_CLASS}>
              {items.map((item) => (
                <PosterCard
                  key={`${mediaType}-${item.id}`}
                  item={item}
                  className="!w-full"
                  sizes={POSTER_SIZES}
                />
              ))}
            </div>

            {/* Otomatik yükleme sentinel'i (ilk sayfalar) */}
            <div ref={sentinelRef} className="h-20" />

            {isFetching && (
              <p className="mt-6 text-center text-sm text-secondary" role="status">
                Daha fazla {noun} yükleniyor…
              </p>
            )}

            {hasMore && page >= AUTO_LOAD_PAGE_LIMIT && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" size="lg" loading={isFetching} onClick={handleLoadMore}>
                  Daha Fazla Yükle
                </Button>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-secondary">Tüm {plural} görüntülendi</p>
                <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0 })}>
                  Başa Dön
                </Button>
              </div>
            )}

            {data && items.length > 0 && (
              <p className="mt-8 text-center text-xs tabular-nums text-muted">
                {formatCount(items.length)} / {formatCount(data.total_results)} {noun} görüntüleniyor
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
