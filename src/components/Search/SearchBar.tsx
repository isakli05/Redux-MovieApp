/**
 * SearchBar Component - Modern & Enhanced Version
 * Navbar'da kullanılacak gelişmiş arama input componenti
 * Otomatik focus, trend aramalar ve modern UI ile
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FilmIcon,
  TvIcon,
  UserIcon,
  FireIcon,
  ClockIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Transition, Combobox } from '@headlessui/react';
import { useDebounce } from '@hooks/useDebounce';
import { useSearchMultiQuery, useGetTrendingForSearchQuery } from '@api/index';
import { getImageUrl } from '@utils/image.utils';
import type { MultiSearchItem } from '../../types/search';

interface SearchBarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function SearchBar({ onClose, isMobile = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 Otomatik focus - Component mount olduğunda
  useEffect(() => {
    // Kısa bir delay ile focus et (modal açılma animasyonu için)
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // API çağrısı - sadece 3 karakterden fazlaysa
  const { data, isLoading, isFetching } = useSearchMultiQuery(
    { query: debouncedQuery, page: 1 },
    {
      skip: debouncedQuery.length < 3,
    }
  );

  // Trending items - dinamik olarak API'den
  const { data: trendingData } = useGetTrendingForSearchQuery();

  // İlk 10 sonucu göster ve kategorilere ayır
  const allResults: MultiSearchItem[] = data?.results.slice(0, 10) || [];
  const movieResults: MultiSearchItem[] = allResults.filter((item: MultiSearchItem) => item.media_type === 'movie').slice(0, 3);
  const tvResults: MultiSearchItem[] = allResults.filter((item: MultiSearchItem) => item.media_type === 'tv').slice(0, 3);
  const personResults: MultiSearchItem[] = allResults.filter((item: MultiSearchItem) => item.media_type === 'person').slice(0, 3);

  // Trend aramalar - API'den ilk 5 sonuç
  const trendingItems: MultiSearchItem[] = trendingData?.results.slice(0, 5) || [];

  // Input değiştiğinde dropdown'u aç
  useEffect(() => {
    if (debouncedQuery.length >= 3 && allResults.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, allResults.length]);

  // Seçim yapıldığında
  const handleSelect = (item: MultiSearchItem) => {
    setIsOpen(false);
    setQuery('');
    
    if (item.media_type === 'movie') {
      navigate(`/movie/${item.id}`);
    } else if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`);
    } else if (item.media_type === 'person') {
      navigate(`/person/${item.id}`);
    }
    
    onClose?.();
  };

  // Enter tuşuna basıldığında arama sayfasına git
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      onClose?.();
    }
  };

  // Temizle butonu
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Trend arama tıklama
  const handleTrendingClick = (item: MultiSearchItem) => {
    // Direkt olarak detay sayfasına git
    handleSelect(item);
  };

  // Trend item'ın başlığını al
  const getTrendingTitle = (item: MultiSearchItem): string => {
    return item.title || item.name || 'İsimsiz';
  };

  // Trend item ikonu
  const getTrendingIcon = (item: MultiSearchItem) => {
    switch (item.media_type) {
      case 'movie': return FilmIcon;
      case 'tv': return TvIcon;
      case 'person': return UserIcon;
      default: return SparklesIcon;
    }
  };

  // Item'ın başlığını al
  const getItemTitle = (item: MultiSearchItem) => {
    return item.title || item.name || 'İsimsiz';
  };

  // Item'ın alt başlığını al
  const getItemSubtitle = (item: MultiSearchItem) => {
    if (item.media_type === 'movie') {
      return `Film${item.release_date ? ` • ${new Date(item.release_date).getFullYear()}` : ''}`;
    } else if (item.media_type === 'tv') {
      return `Dizi${item.first_air_date ? ` • ${new Date(item.first_air_date).getFullYear()}` : ''}`;
    } else if (item.media_type === 'person') {
      return `Kişi${item.known_for_department ? ` • ${item.known_for_department}` : ''}`;
    }
    return '';
  };

  // Item'ın resmini al
  const getItemImage = (item: MultiSearchItem) => {
    if (item.media_type === 'person') {
      return item.profile_path 
        ? getImageUrl(item.profile_path, 'w185')
        : '/assets/nullUser.svg';
    } else {
      return item.poster_path 
        ? getImageUrl(item.poster_path, 'w185')
        : '/assets/tv_null.svg';
    }
  };

  return (
    <Combobox value={null} onChange={(value: MultiSearchItem | null) => value && handleSelect(value)}>
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/30">
              <MagnifyingGlassIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Arama
                <SparklesIcon className="h-5 w-5 text-cyan-400" />
              </h2>
              <p className="text-sm text-gray-400">
                Film, dizi veya kişi arayın
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative mb-6">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>
            
            <div className="relative">
              {/* Arama İkonu */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>

              {/* Input */}
              <Combobox.Input
                ref={inputRef}
                className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 py-4 pl-14 pr-14 text-lg text-white placeholder:text-gray-400 focus:border-cyan-500 focus:bg-slate-800 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                placeholder="Örneğin: Avengers, Breaking Bad, Tom Hanks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />

              {/* Temizle / Loading */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {(isLoading || isFetching) && query.length >= 3 ? (
                  <div className="relative h-6 w-6">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30"></div>
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  </div>
                ) : query.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Hint Text */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              En az 3 karakter girin
            </span>
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-gray-400">
              Enter
            </kbd>
          </div>
        </form>

        {/* Results or Trending */}
        {query.length === 0 ? (
          /* Trend Aramalar - Input boşken */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
              <FireIcon className="h-5 w-5 text-orange-500" />
              Günün Trendleri
            </div>
            {trendingItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {trendingItems.map((item: MultiSearchItem, index: number) => {
                  const Icon = getTrendingIcon(item);
                  return (
                    <button
                      key={`trending-${item.id}-${index}`}
                      onClick={() => handleTrendingClick(item)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 group text-left"
                    >
                      {/* Küçük poster */}
                      <div className="flex-shrink-0">
                        <img
                          src={
                            item.media_type === 'person'
                              ? item.profile_path
                                ? getImageUrl(item.profile_path, 'w185')
                                : '/assets/nullUser.svg'
                              : item.poster_path
                              ? getImageUrl(item.poster_path, 'w185')
                              : '/assets/tv_null.svg'
                          }
                          alt={getTrendingTitle(item)}
                          className="w-10 h-14 object-cover rounded shadow-md"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = item.media_type === 'person' 
                              ? '/assets/nullUser.svg' 
                              : '/assets/tv_null.svg';
                          }}
                        />
                      </div>
                      
                      {/* İçerik */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                          <span className="text-gray-300 group-hover:text-white transition-colors font-medium truncate">
                            {getTrendingTitle(item)}
                          </span>
                        </div>
                        {item.vote_average && item.vote_average > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="text-yellow-500">★</span>
                            <span>{item.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Trend ikonu */}
                      <ArrowTrendingUpIcon className="h-5 w-5 text-orange-500 flex-shrink-0 group-hover:text-orange-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Trend aramalar yükleniyor...
              </div>
            )}
          </div>
        ) : query.length > 0 && query.length < 3 ? (
          /* Minimum karakter uyarısı */
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm">
              Arama yapmak için en az <span className="text-white font-semibold">3 karakter</span> girin
            </p>
          </div>
        ) : (
          /* Arama Sonuçları */
          <Transition
            show={isOpen && allResults.length > 0}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <Combobox.Options
              static
              className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 custom-scrollbar"
            >
              {/* Filmler */}
              {movieResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-400">
                    <FilmIcon className="h-5 w-5 text-cyan-400" />
                    Filmler ({movieResults.length})
                  </div>
                  <div className="space-y-2">
                    {movieResults.map((item: MultiSearchItem) => (
                      <ResultItem key={`movie-${item.id}`} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Diziler */}
              {tvResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-400">
                    <TvIcon className="h-5 w-5 text-purple-400" />
                    Diziler ({tvResults.length})
                  </div>
                  <div className="space-y-2">
                    {tvResults.map((item: MultiSearchItem) => (
                      <ResultItem key={`tv-${item.id}`} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Kişiler */}
              {personResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-400">
                    <UserIcon className="h-5 w-5 text-green-400" />
                    Kişiler ({personResults.length})
                  </div>
                  <div className="space-y-2">
                    {personResults.map((item: MultiSearchItem) => (
                      <ResultItem key={`person-${item.id}`} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tüm Sonuçlar Butonu */}
              {allResults.length > 0 && (
                <div className="pt-4 border-t border-slate-700/50">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Tüm sonuçları gör ({data?.total_results || 0})
                  </button>
                </div>
              )}
            </Combobox.Options>
          </Transition>
        )}

        {/* Sonuç Bulunamadı */}
        {isOpen && allResults.length === 0 && query.length >= 3 && !isLoading && !isFetching && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-4">
              <MagnifyingGlassIcon className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-400 text-sm mb-1">
              "<span className="text-white font-medium">{query}</span>" için hiçbir sonuç bulunamadı
            </p>
            <p className="text-gray-500 text-xs">
              Farklı bir arama terimi deneyin
            </p>
          </div>
        )}
      </div>
    </Combobox>
  );
}

// Sonuç item componenti
function ResultItem({ item }: { item: MultiSearchItem }) {
  const getItemTitle = (searchItem: MultiSearchItem) => searchItem.title || searchItem.name || 'İsimsiz';
  
  const getItemSubtitle = (searchItem: MultiSearchItem) => {
    if (searchItem.media_type === 'movie') {
      return `Film${searchItem.release_date ? ` • ${new Date(searchItem.release_date).getFullYear()}` : ''}`;
    } else if (searchItem.media_type === 'tv') {
      return `Dizi${searchItem.first_air_date ? ` • ${new Date(searchItem.first_air_date).getFullYear()}` : ''}`;
    } else if (searchItem.media_type === 'person') {
      return `Kişi${searchItem.known_for_department ? ` • ${searchItem.known_for_department}` : ''}`;
    }
    return '';
  };

  const getItemImage = (searchItem: MultiSearchItem) => {
    if (searchItem.media_type === 'person') {
      return searchItem.profile_path 
        ? getImageUrl(searchItem.profile_path, 'w185')
        : '/assets/nullUser.svg';
    } else {
      return searchItem.poster_path 
        ? getImageUrl(searchItem.poster_path, 'w185')
        : '/assets/tv_null.svg';
    }
  };

  return (
    <Combobox.Option
      value={item}
      className={({ active }) =>
        `flex items-center gap-4 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 ${
          active 
            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30' 
            : 'bg-slate-800/30 border-2 border-transparent hover:border-slate-700'
        }`
      }
    >
      {/* Resim */}
      <div className="relative flex-shrink-0">
        <img
          src={getItemImage(item)}
          alt={getItemTitle(item)}
          className="w-14 h-20 object-cover rounded-lg shadow-lg"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = item.media_type === 'person' 
              ? '/assets/nullUser.svg' 
              : '/assets/tv_null.svg';
          }}
        />
        {item.vote_average && item.vote_average > 0 && item.media_type !== 'person' && (
          <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-900 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
            {item.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-base line-clamp-1 mb-1">
          {getItemTitle(item)}
        </div>
        <div className="text-gray-400 text-sm line-clamp-1 mb-2">
          {getItemSubtitle(item)}
        </div>
        {item.overview && (
          <div className="text-gray-500 text-xs line-clamp-2">
            {item.overview}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Combobox.Option>
  );
}
