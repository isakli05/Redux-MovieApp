/**
 * Movies Page - Paginated Implementation
 * Senior-level pagination with modern UX
 * 
 * Features:
 * - Smart pagination component
 * - URL sync (page in URL)
 * - Smooth transitions
 * - SEO friendly
 * - Memory efficient
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StarIcon, PlayIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { useGetPopularMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';
import { SmartPagination } from '../../components/Pagination/SmartPagination';

function MoviesPaginated() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [page, setPage] = useState(pageFromUrl);
  
  const { data: movies, isLoading, isFetching, error } = useGetPopularMoviesQuery(page);

  // Sync URL with page state
  useEffect(() => {
    if (page !== pageFromUrl) {
      setSearchParams({ page: page.toString() }, { replace: true });
    }
  }, [page, pageFromUrl, setSearchParams]);

  // Update page when URL changes (browser back/forward)
  useEffect(() => {
    if (pageFromUrl !== page && pageFromUrl >= 1) {
      setPage(pageFromUrl);
    }
  }, [pageFromUrl]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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
            {movies && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg px-4 py-2">
                  <span className="text-slate-400">Toplam: </span>
                  <span className="text-cyan-400 font-semibold">{movies.total_results.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Loading Overlay */}
        <div className={`
          transition-opacity duration-300
          ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}
        `}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {isLoading ? (
              // Skeleton Loader
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
              movies?.results.map((movie) => (
                <Link
                  key={movie.id}
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
        </div>

        {/* Pagination */}
        {movies && (
          <SmartPagination
            currentPage={page}
            totalPages={movies.total_pages}
            onPageChange={handlePageChange}
            isLoading={isFetching}
            showPageJump={true}
          />
        )}
      </div>
    </div>
  );
}

export default MoviesPaginated;
