import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, CalendarIcon, ArrowPathIcon, TvIcon } from '@heroicons/react/24/solid';
import { useGetPopularTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

function TVs() {
  const [page, setPage] = useState(1);
  const { data: tvShows, isLoading, isFetching, error } = useGetPopularTVShowsQuery(page);

  const handleLoadMore = () => {
    if (tvShows && page < tvShows.total_pages) {
      setPage((prev) => prev + 1);
    }
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
        </div>
      </div>

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
            tvShows?.results.map((tv) => (
              <Link
                key={tv.id}
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

        {tvShows && page < tvShows.total_pages && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isFetching}
              className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl font-semibold text-white hover:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

        {tvShows && (
          <div className="text-center mt-6 text-slate-400 text-sm">
            Sayfa {page} / {tvShows.total_pages.toLocaleString('tr-TR')} • {tvShows.total_results.toLocaleString('tr-TR')} dizi
          </div>
        )}
      </div>
    </div>
  );
}

export default TVs;
