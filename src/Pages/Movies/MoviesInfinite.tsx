/**
 * Movies Page - Infinite Scroll Implementation
 * Senior-level implementation with performance optimizations
 * 
 * Features:
 * - Accumulated data (keeps previous pages)
 * - Intersection Observer for auto-load
 * - Virtual scrolling ready
 * - Memory management
 * - Smooth UX
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useGetPopularMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

// Types
interface Movie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

// Constants
const MAX_PAGES_IN_MEMORY = 15; // Max 300 films in DOM (15 pages × 20 films)
const ITEMS_PER_PAGE = 20;

function MoviesInfinite() {
  const [page, setPage] = useState(1);
  const [accumulatedMovies, setAccumulatedMovies] = useState<Movie[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { data: moviesData, isLoading, isFetching, error } = useGetPopularMoviesQuery(page);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Accumulate movies from new pages
  useEffect(() => {
    if (moviesData?.results) {
      setAccumulatedMovies((prev) => {
        // Prevent duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const newMovies = moviesData.results.filter(m => !existingIds.has(m.id));
        
        const updated = [...prev, ...newMovies];
        
        // Memory management: Keep only last MAX_PAGES_IN_MEMORY pages
        if (updated.length > MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE) {
          console.log('🧹 Memory cleanup: Removing old movies');
          return updated.slice(-MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE);
        }
        
        return updated;
      });
      
      // Check if there are more pages
      setHasMore(page < moviesData.total_pages);
      isInitialLoad.current = false;
    }
  }, [moviesData, page]);

  // Intersection Observer for auto-load
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const handleLoadMore = useCallback(() => {
    if (moviesData && page < moviesData.total_pages && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [moviesData, page, isFetching]);

  // Scroll to top button
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">Filmler yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/50">
                  <StarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Popüler Filmler
                </h1>
                <p className="text-slate-400 mt-1">
                  En çok izlenen ve beğenilen filmler
                </p>
              </div>
            </div>
            
            {/* Stats */}
            {moviesData && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg px-4 py-2">
                  <span className="text-slate-400">Yüklenen: </span>
                  <span className="text-cyan-400 font-semibold">{accumulatedMovies.length}</span>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg px-4 py-2">
                  <span className="text-slate-400">Toplam: </span>
                  <span className="text-cyan-400 font-semibold">{moviesData.total_results.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {isLoading && isInitialLoad.current ? (
            // Skeleton Loader - Initial Load Only
            Array.from({ length: 20 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="group relative animate-pulse"
              >
                <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700/50 rounded w-full" />
                  <div className="h-4 bg-slate-700/50 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            accumulatedMovies.map((movie) => (
              <Link
                key={`movie-${movie.id}`}
                to={`/movie/${createSlug(movie.id, movie.original_title)}`}
                className="group relative"
              >
                <div className="relative">
                  {/* Movie Card */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-cyan-500/20 transition-all duration-300">
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm font-bold">
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-cyan-500 backdrop-blur-sm p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                          <PlayIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Info on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(movie.release_date, { year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Poster Image */}
                    <img
                      loading="lazy"
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Title (Desktop) */}
                  <div className="mt-3 space-y-1">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight group-hover:text-cyan-400 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(movie.release_date, { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Intersection Observer Target */}
        <div ref={loadMoreRef} className="h-20" />

        {/* Loading Indicator */}
        {isFetching && !isInitialLoad.current && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <ArrowPathIcon className="h-5 w-5 text-cyan-400 animate-spin" />
              <span className="text-white font-medium">Daha fazla film yükleniyor...</span>
            </div>
          </div>
        )}

        {/* End of List */}
        {!hasMore && accumulatedMovies.length > 0 && (
          <div className="text-center mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <span className="text-slate-400">🎬</span>
              <span className="text-white font-medium">Tüm filmler yüklendi</span>
            </div>
            <button
              onClick={scrollToTop}
              className="block mx-auto px-6 py-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ↑ Başa Dön
            </button>
          </div>
        )}

        {/* Page Info */}
        {moviesData && (
          <div className="text-center mt-6 text-slate-400 text-sm">
            Sayfa {page} / {moviesData.total_pages.toLocaleString('tr-TR')} yüklendi
          </div>
        )}
      </div>

      {/* Scroll to Top FAB */}
      {accumulatedMovies.length > 40 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-110 z-50"
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

export default MoviesInfinite;
