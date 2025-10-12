import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useGetPopularPersonsQuery } from '../../api/endpoints/persons.endpoints';
import { getProfileUrl } from '../../utils';

function Persons() {
  const [page, setPage] = useState(1);
  const { data: persons, isLoading, isFetching } = useGetPopularPersonsQuery(page);

  const handleLoadMore = () => {
    if (persons && page < persons.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl shadow-lg shadow-purple-500/50">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Popüler Kişiler
              </h1>
              <p className="text-slate-400 mt-1">
                En popüler aktörler ve yapımcılar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Persons Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {isLoading && page === 1 ? (
            // Skeleton Loader
            Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="group relative animate-pulse">
                <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700/50 rounded w-full" />
                  <div className="h-3 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/50 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            persons?.results.map((person) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group relative"
              >
                <div className="relative">
                  {/* Person Card */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-300 mb-3">
                    {/* Popular Badge */}
                    {person.popularity > 50 && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm rounded-lg">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-semibold line-clamp-2 text-sm leading-tight">
                          {person.name}
                        </p>
                      </div>
                    </div>

                    {/* Profile Image */}
                    <img
                      loading="lazy"
                      src={getProfileUrl(person.profile_path)}
                      alt={person.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight group-hover:text-purple-400 transition-colors">
                      {person.name}
                    </h3>
                    <div className="space-y-1">
                      {person.known_for?.slice(0, 2).map((item: any) => (
                        <p key={item.id} className="text-slate-400 text-xs line-clamp-1">
                          {item.title || item.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Load More Button */}
        {persons && page < persons.total_pages && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isFetching}
              className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl font-semibold text-white hover:border-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

        {/* Page Info */}
        {persons && (
          <div className="text-center mt-6 text-slate-400 text-sm">
            Sayfa {page} / {persons.total_pages.toLocaleString('tr-TR')} • {persons.total_results.toLocaleString('tr-TR')} kişi
          </div>
        )}
      </div>
    </div>
  );
}

export default Persons;
