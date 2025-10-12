import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useDiscoverMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate, voteToPercentage } from '../../utils';

type WatchType = 'with_watch_monetization_types=flatrate' | 'with_watch_monetization_types=rent' | 'with_watch_monetization_type=3|2';

const categories = [
  { id: 0, label: 'Streaming', value: 'with_watch_monetization_types=flatrate' as WatchType },
  { id: 2, label: 'Kiralık', value: 'with_watch_monetization_types=rent' as WatchType },
  { id: 3, label: 'Sinemada', value: 'with_watch_monetization_type=3|2' as WatchType },
];

function Popular() {
  const [watchType, setWatchType] = useState<WatchType>('with_watch_monetization_types=flatrate');
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: popular, isLoading } = useDiscoverMoviesQuery({ watchType });

  const handleClick = (index: number, type: WatchType) => {
    setWatchType(type);
    setActiveIndex(index);
  };

  return (
    <section className="relative">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Popüler Filmler
          </h2>
          <p className="text-slate-400">En çok izlenen ve beğenilen filmler</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-1.5 rounded-xl">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleClick(category.id, category.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${activeIndex === category.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 animate-pulse">
              <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3" />
              <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-slate-800/50">
          {popular?.results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movie/${createSlug(movie.id, movie.original_title)}`}
              className="group flex-shrink-0 w-48"
            >
              <div className="relative">
                {/* Movie Card */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-xl">
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-white text-sm font-bold">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-cyan-500/90 backdrop-blur-sm p-4 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <PlayIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Movie Poster */}
                  <img
                    loading="lazy"
                    src={getPosterUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Movie Info */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formatDate(movie.release_date, { year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default Popular;
