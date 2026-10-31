/**
 * SearchBar — Navbar'ın Cmd+K diyalogunda yaşayan arama combobox'ı
 * (Cinematic Atlas spec §6 Search).
 *
 * Entegrasyon sözleşmesi (Navbar.tsx): DEFAULT EXPORT + opsiyonel `onClose`
 * prop'u — Escape'te ve gezinme sonrası çağrılır.
 *
 * - Debounce kalır (useDebounce, 300ms; tuş başına istek yok).
 * - TR + EN multi arama birleştirilir, `media_type-id` üzerinden dedupe
 *   edilir (TR sonucu tercih edilir).
 * - Trend önerileri input boşken gösterilir.
 * - Klavye: ↑/↓ önerilerde gezinir, Enter vurgulu öneriye gider (Headless UI
 *   Combobox), vurgu yokken arama sayfasına gönderir, Escape kapatır.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Combobox } from '@headlessui/react';
import {
  FilmIcon,
  FireIcon,
  MagnifyingGlassIcon,
  TvIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@hooks/useDebounce';
import {
  useGetTrendingForSearchQuery,
  useSearchMultiENQuery,
  useSearchMultiQuery,
} from '@api/index';
import { getImageUrl } from '@utils/image.utils';
import type { MultiSearchItem } from '@/types/search';

const DEBOUNCE_MS = 300;
/** Öneri istekleri için minimum karakter uzunluğu. */
const MIN_SUGGEST_LENGTH = 3;
/** Enter ile arama sayfasına gitmek için minimum uzunluk. */
const MIN_SUBMIT_LENGTH = 2;
const SUGGESTION_LIMIT = 9;
const TRENDING_LIMIT = 5;

export interface SearchBarProps {
  /** Navbar diyalogunun kapatma callback'i (Escape ve gezinme sonrası). */
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Paylaşılan saf yardımcılar (Search sayfası ve testler de kullanır)
// ---------------------------------------------------------------------------

const resultKey = (item: MultiSearchItem): string => `${item.media_type}-${item.id}`;

/** Minimal sayfa şekli — gerçek API tipleri bunu yapısal olarak sağlar. */
type ResultsLike = { results?: MultiSearchItem[] } | undefined;
type TotalsLike = { total_results?: number; total_pages?: number } | undefined;

/**
 * TR + EN multi arama sayfalarını tek listede birleştirir; aynı
 * `media_type-id` ikilisi bir kez yer alır (önce gelen TR sonucu korunur,
 * EN'den yalnızca TR'de olmayanlar eklenir). API relevance sırası korunur.
 */
export function mergeSearchResults(tr?: ResultsLike, en?: ResultsLike): MultiSearchItem[] {
  const seen = new Set<string>();
  const merged: MultiSearchItem[] = [];
  for (const item of [...(tr?.results ?? []), ...(en?.results ?? [])]) {
    const key = resultKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

/**
 * Birleşik corpus için gösterilecek toplam: iki dilin resmi `total_results`
 * değerlerinden büyüğü (dedupe edilmiş birleşik toplam API'den bilinemez;
 * bu yüzden tek bir dilin gerçek API sayısı baz alınır, sayfa uzunluğu asla
 * kullanılmaz — defect L).
 */
export function mergedTotalResults(tr?: TotalsLike, en?: TotalsLike): number {
  return Math.max(tr?.total_results ?? 0, en?.total_results ?? 0);
}

/** Birleşik corpus'un sayfalanabilir üst sınırı (TMDB 500 sınırıyla). */
export function mergedTotalPages(tr?: TotalsLike, en?: TotalsLike): number {
  return Math.min(500, Math.max(tr?.total_pages ?? 0, en?.total_pages ?? 0));
}

/** movie.title | tv.name | person.name → görüntülenecek başlık. */
export const resultTitle = (item: MultiSearchItem): string =>
  item.title || item.name || 'İsimsiz';

/** Yıl bilgisi: film için release_date, dizi için first_air_date. */
export const resultYear = (item: MultiSearchItem): string => {
  const date = item.release_date || item.first_air_date || '';
  return /^\d{4}/.test(date) ? date.slice(0, 4) : '';
};

/** Kart alt satırı; kişilerde bölüm (known_for_department) gösterilir. */
export const resultSubtitle = (item: MultiSearchItem): string => {
  const year = resultYear(item);
  switch (item.media_type) {
    case 'movie':
      return year ? `Film · ${year}` : 'Film';
    case 'tv':
      return year ? `Dizi · ${year}` : 'Dizi';
    case 'person':
      return item.known_for_department ? `Kişi · ${item.known_for_department}` : 'Kişi';
    default:
      return '';
  }
};

/** Profil/afiş görseli; yoksa null (çağıran taraf placeholder çizer). */
export const resultImage = (item: MultiSearchItem, size: 'w185' | 'w92' = 'w185'): string | null => {
  const path = item.media_type === 'person' ? item.profile_path : item.poster_path;
  return path ? getImageUrl(path, size) : null;
};

/** Detay rotası: /movie/:id | /tv/:id | /person/:id. */
export const resultRoute = (item: MultiSearchItem): string => `/${item.media_type}/${item.id}`;

/** 1.234 gibi tr-TR biçimli sayı (defect L). */
export const formatCount = (value: number): string => value.toLocaleString('tr-TR');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TYPE_ICON = {
  movie: FilmIcon,
  tv: TvIcon,
  person: UserIcon,
} as const;

function onImageError(event: SyntheticEvent<HTMLImageElement>, item: MultiSearchItem): void {
  const fallback = item.media_type === 'person' ? '/assets/nullUser.svg' : '/assets/tv_null.svg';
  event.currentTarget.src = fallback;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Diyalog açılış animasyonundan sonra otomatik odak.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // TR + EN multi arama — yalnızca debounce sonrası ve 3+ karakterde.
  const skipSearch = debouncedQuery.trim().length < MIN_SUGGEST_LENGTH;
  const { data: dataTR, isLoading, isFetching } = useSearchMultiQuery(
    { query: debouncedQuery.trim(), page: 1 },
    { skip: skipSearch },
  );
  const { data: dataEN } = useSearchMultiENQuery(
    { query: debouncedQuery.trim(), page: 1 },
    { skip: skipSearch },
  );

  // Trend önerileri (1 saat cache'li tek istek).
  const { data: trendingData } = useGetTrendingForSearchQuery();

  const suggestions = useMemo(
    () => mergeSearchResults(dataTR, dataEN).slice(0, SUGGESTION_LIMIT),
    [dataTR, dataEN],
  );
  const totalResults = mergedTotalResults(dataTR, dataEN);
  const trendingItems = useMemo(
    () => (trendingData?.results ?? []).slice(0, TRENDING_LIMIT),
    [trendingData],
  );

  const grouped = useMemo(
    () => ({
      movie: suggestions.filter((item) => item.media_type === 'movie'),
      tv: suggestions.filter((item) => item.media_type === 'tv'),
      person: suggestions.filter((item) => item.media_type === 'person'),
    }),
    [suggestions],
  );

  const showSearching = (isLoading || isFetching) && !skipSearch;
  const showNoResults =
    !skipSearch && !showSearching && suggestions.length === 0 && debouncedQuery.trim().length > 0;

  const handleSelect = (item: MultiSearchItem | null): void => {
    if (!item) return;
    navigate(resultRoute(item));
    setQuery('');
    onClose?.();
  };

  // Enter: vurgulu öneri varsa Combobox seçer (yukarıda handleSelect);
  // vurgu yoksa form submit → tam sonuç sayfası.
  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < MIN_SUBMIT_LENGTH) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuery('');
    onClose?.();
  };

  // Escape → diyalogu kapat (Navbar'ın onClose sözleşmesi).
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') onClose?.();
  };

  const handleClear = (): void => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <Combobox value={null} onChange={(value: MultiSearchItem | null) => handleSelect(value)}>
      <form onSubmit={handleSubmit} className="w-full">
        {/* Marka başlığı — Fraunces, gold vurgu */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-overlay text-accent">
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-primary">Arama</h2>
            <p className="text-xs text-secondary">Film, dizi veya kişi arayın</p>
          </div>
        </div>

        {/* Giriş alanı — surface-overlay, gold odak halkası */}
        <div className="group relative flex items-center rounded-lg border border-line-strong bg-surface-overlay transition-colors duration-150 ease-cine focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
          <span className="pointer-events-none pl-4">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-secondary transition-colors group-focus-within:text-accent"
              aria-hidden="true"
            />
          </span>
          <Combobox.Input
            ref={inputRef}
            className="w-full bg-transparent py-3.5 pl-3 pr-12 text-base text-primary placeholder:text-muted focus:outline-none"
            placeholder="Örneğin: Inception, Breaking Bad, Tom Hanks…"
            aria-label="Arama sorgusu"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="absolute right-3 flex items-center">
            {showSearching ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent"
                role="progressbar"
                aria-label="Aranıyor"
              />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Sorguyu temizle"
                className="rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-primary"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </span>
        </div>

        <p className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Öneriler için en az {MIN_SUGGEST_LENGTH} karakter</span>
          <kbd className="rounded border border-line bg-surface-overlay px-1.5 py-0.5 leading-none">
            Enter
          </kbd>
        </p>

        {/* Boş girişte: günün trendleri */}
        {query.trim().length === 0 && (
          <div className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
              <FireIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              Günün Trendleri
            </h3>
            {trendingItems.length > 0 ? (
              <ul className="space-y-1">
                {trendingItems.map((item) => {
                  const Icon = TYPE_ICON[item.media_type as keyof typeof TYPE_ICON];
                  const image = resultImage(item, 'w92');
                  return (
                    <li key={resultKey(item)}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-surface-overlay px-3 py-2 text-left transition-colors duration-150 ease-cine hover:border-line-strong hover:bg-surface-raised"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            loading="lazy"
                            onError={(event) => onImageError(event, item)}
                            className="h-14 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-surface-raised text-muted">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-primary">
                            {resultTitle(item)}
                          </span>
                          <span className="block truncate text-xs text-secondary">
                            {resultSubtitle(item)}
                            {item.vote_average ? (
                              <span className="ml-2 tabular-nums text-accent">
                                ★ {item.vote_average.toFixed(1)}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-1 py-4 text-sm text-muted">Trend önerileri yükleniyor…</p>
            )}
          </div>
        )}

        {/* Öneriler (3+ karakter) */}
        {query.trim().length >= MIN_SUGGEST_LENGTH && (
          <Combobox.Options
            static
            aria-label="Arama önerileri"
            className="custom-scrollbar mt-4 max-h-[52vh] space-y-4 overflow-y-auto pr-1"
          >
            {(['movie', 'tv', 'person'] as const).map((type) =>
              grouped[type].length > 0 ? (
                <li key={type}>
                  <h4 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                    {type === 'movie' ? 'Filmler' : type === 'tv' ? 'Diziler' : 'Kişiler'}
                    <span className="tabular-nums text-muted">({grouped[type].length})</span>
                  </h4>
                  <ul className="space-y-1">
                    {grouped[type].map((item) => (
                      <SuggestionRow key={resultKey(item)} item={item} />
                    ))}
                  </ul>
                </li>
              ) : null,
            )}

            {suggestions.length > 0 && (
              <li className="border-t border-line pt-3">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors duration-150 ease-cine hover:bg-accent-hover"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
                  Tüm sonuçları gör
                  {totalResults > 0 && <span className="tabular-nums">({formatCount(totalResults)})</span>}
                </button>
              </li>
            )}
          </Combobox.Options>
        )}

        {/* Sonuç yok */}
        {showNoResults && (
          <p className="px-1 py-6 text-center text-sm text-secondary">
            “<span className="font-medium text-primary">{debouncedQuery.trim()}</span>” için sonuç
            bulunamadı. Farklı bir terim deneyin.
          </p>
        )}
      </form>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------

function SuggestionRow({ item }: { item: MultiSearchItem }) {
  const Icon = TYPE_ICON[item.media_type as keyof typeof TYPE_ICON];
  const image = resultImage(item);
  const isPerson = item.media_type === 'person';

  return (
    <Combobox.Option
      value={item}
      className={({ active }) =>
        `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-150 ease-cine ${
          active
            ? 'border-line-strong bg-surface-raised'
            : 'border-transparent bg-surface-overlay hover:bg-surface-raised'
        }`
      }
    >
      {({ active }) => (
        <>
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              onError={(event) => onImageError(event, item)}
              className={`shrink-0 rounded-md object-cover ${
                isPerson ? 'h-14 w-12' : 'h-14 w-10'
              }`}
            />
          ) : (
            <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-surface-raised text-muted">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-primary">
              {resultTitle(item)}
            </span>
            <span className="block truncate text-xs text-secondary">{resultSubtitle(item)}</span>
            {!isPerson && item.overview ? (
              <span className="mt-0.5 block truncate text-xs text-muted">{item.overview}</span>
            ) : null}
          </span>
          {!isPerson && item.vote_average ? (
            <span
              className={`shrink-0 tabular-nums text-sm font-semibold ${
                active ? 'text-accent' : 'text-secondary'
              }`}
            >
              ★ {item.vote_average.toFixed(1)}
            </span>
          ) : null}
        </>
      )}
    </Combobox.Option>
  );
}
