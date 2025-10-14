/**
 * TV Shows Page - Infinite Scroll Implementation
 * Netflix-style browsing experience
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, CalendarIcon, ArrowPathIcon, TvIcon } from '@heroicons/react/24/solid';
import { useGetPopularTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

interface TVShow {
  id: number;
  name: string;
  original_name: string;
  poster_path: string;
  vote_average: number;
  first_air_date: string;
}

const MAX_PAGES_IN_MEMORY = 15; // Max 300 shows in DOM
const ITEMS_PER_PAGE = 20;

function TVs() {
  const [page, setPage] = useState(1);
  const [accumulatedShows, setAccumulatedShows] = useState<TVShow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { data: tvShows, isLoading, isFetching, error } = useGetPopularTVShowsQuery(page);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Accumulate shows from new pages
  useEffect(() => {
    if (tvShows?.results) {
      setAccumulatedShows((prev) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newShows = tvShows.results.filter(s => !existingIds.has(s.id));
        const updated = [...prev, ...newShows];
        
        // Memory management
        if (updated.length > MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE) {
          console.log('🧹 Memory cleanup: Removing old TV shows');
          return updated.slice(-MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE);
        }
        
        return updated;
      });
      
      setHasMore(page < tvShows.total_pages);
      isInitialLoad.current = false;
    }
  }, [tvShows, page]);

  // Intersection Observer for auto-load (first 5 pages only - Netflix style)
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isFetching) return;
    
    // Auto-load only for first 5 pages (100 items), then show button
    if (page >= 5) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching && page < 5) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetching, page]);

  const handleLoadMore = useCallback(() => {
    if (tvShows && page < tvShows.total_pages && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [tvShows, page, isFetching]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">TV şovları yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-3 rounded-xl shadow-lg shadow-blue-500/50">
                  <TvIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Popüler Diziler
                </h1>
                <p className="text-slate-400 mt-1">
                  En çok izlenen ve beğenilen diziler
                </p>
              </div>
            </div>
            
            {/* Stats */}
            {tvShows && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg px-4 py-2">
                  <span className="text-slate-400">Yüklenen: </span>
                  <span className="text-blue-400 font-semibold">{accumulatedShows.length}</span>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg px-4 py-2">
                  <span className="text-slate-400">Toplam: </span>
                  <span className="text-blue-400 font-semibold">{tvShows.total_results.toLocaleString('tr-TR')}</span>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-500/30 rounded-lg px-4 py-2">
                  <span className="text-blue-300 font-semibold">∞ Netflix Style</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {isLoading && isInitialLoad.current ? (
            Array.from({ length: 20 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="group relative animate-pulse">
                <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700/50 rounded w-full" />
                  <div className="h-4 bg-slate-700/50 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            accumulatedShows.map((tv) => (
              <Link
                key={`tv-${tv.id}`}
                to={`/tv/${createSlug(tv.id, tv.original_name)}`}
                className="group relative"
              >
                <div className="relative">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-300">
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm font-bold">
                        {tv.vote_average.toFixed(1)}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-blue-500 backdrop-blur-sm p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                          <PlayIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight">
                          {tv.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(tv.first_air_date, { year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <img
                      loading="lazy"
                      src={getPosterUrl(tv.poster_path)}
                      alt={tv.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight group-hover:text-blue-400 transition-colors">
                      {tv.name}
                    </h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(tv.first_air_date, { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Intersection Observer Target (for auto-load first 5 pages) */}
        <div ref={loadMoreRef} className="h-20" />

        {/* Loading Indicator (auto-loading) */}
        {isFetching && !isInitialLoad.current && page < 5 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-white font-medium">Daha fazla dizi yükleniyor...</span>
            </div>
          </div>
        )}

        {/* Load More Button (Netflix style - after 5 pages) */}
        {hasMore && page >= 5 && !isFetching && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl font-semibold text-white hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                <span>Daha Fazla Dizi Yükle</span>
                <ArrowPathIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
              </div>
            </button>
          </div>
        )}

        {/* Loading Indicator (manual loading) */}
        {isFetching && page >= 5 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-white font-medium">Yükleniyor...</span>
            </div>
          </div>
        )}

        {/* End of List */}
        {!hasMore && accumulatedShows.length > 0 && (
          <div className="text-center mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <span className="text-slate-400">📺</span>
              <span className="text-white font-medium">Tüm diziler görüntülendi</span>
            </div>
            <button
              onClick={scrollToTop}
              className="block mx-auto px-6 py-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ↑ Başa Dön
            </button>
          </div>
        )}

        {/* Page Info */}
        {tvShows && (
          <div className="text-center mt-6 text-slate-400 text-sm">
            Sayfa {page} / {tvShows.total_pages.toLocaleString('tr-TR')} yüklendi
          </div>
        )}
      </div>

      {/* Scroll to Top FAB */}
      {accumulatedShows.length > 40 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 hover:scale-110 z-50"
          aria-label="Başa dön"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default TVs;
