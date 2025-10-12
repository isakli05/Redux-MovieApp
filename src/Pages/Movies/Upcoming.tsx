import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, CalendarIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useGetUpcomingMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

function Upcoming() {
  const [page, setPage] = useState(1);
  const { data: upcomingMovies, isLoading, isFetching } = useGetUpcomingMoviesQuery(page);

  const handleLoadMore = () => {
    if (upcomingMovies && page < upcomingMovies.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl shadow-lg shadow-orange-500/50">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Yakında Gelecek Filmler
              </h1>
              <p className="text-slate-400 mt-1">
                Vizyona girecek yeni filmler
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {isLoading && page === 1 ? (
            Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="group relative animate-pulse">
                <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700/50 rounded w-full" />
                  <div className="h-4 bg-slate-700/50 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            upcomingMovies?.results.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${createSlug(movie.id, movie.original_title)}`}
                className="group relative"
              >
                <div className="relative">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-orange-500/20 transition-all duration-300">
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm font-bold">
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500 backdrop-blur-sm p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                          <PlayIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>

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

                    <img
                      loading="lazy"
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight group-hover:text-orange-400 transition-colors">
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

        {upcomingMovies && page < upcomingMovies.total_pages && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isFetching}
              className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl font-semibold text-white hover:border-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-orange-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                {isFetching ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <span>Daha Fazla Yükle</span>
                    <ArrowPathIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {upcomingMovies && (
          <div className="text-center mt-6 text-slate-400 text-sm">
            Sayfa {page} / {upcomingMovies.total_pages.toLocaleString('tr-TR')} • {upcomingMovies.total_results.toLocaleString('tr-TR')} film
          </div>
        )}
      </div>
    </div>
  );
}

export default Upcoming;
