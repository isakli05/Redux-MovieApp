import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, FireIcon } from '@heroicons/react/24/solid';
import { useGetTrendingQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';
import type { Result } from '../../types/Movies';

type TimeWindow = 'day' | 'week';

const timeOptions = [
  { id: 0, label: 'Bugün', value: 'day' as TimeWindow },
  { id: 1, label: 'Bu Hafta', value: 'week' as TimeWindow },
];

function Trending() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('day');
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: trending, isLoading } = useGetTrendingQuery(timeWindow);

  const handleClick = (index: number, time: TimeWindow) => {
    setTimeWindow(time);
    setActiveIndex(index);
  };

  return (
    <section className="relative">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FireIcon className="h-8 w-8 text-orange-400 animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Trendler
            </h2>
          </div>
          <p className="text-slate-400">En çok konuşulan film ve diziler</p>
        </div>

        {/* Time Tabs */}
        <div className="flex gap-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-1.5 rounded-xl">
          {timeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleClick(option.id, option.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${activeIndex === option.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Grid */}
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
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-slate-800/50">
          {trending?.results.map((item: Result, index: number) => {
            const title = item.title || item.name;
            const originalTitle = item.original_title || item.original_name;
            const releaseDate = item.release_date || item.first_air_date;
            const mediaType = item.media_type || 'movie';

            return (
              <Link
                key={item.id}
                to={`/${mediaType}/${createSlug(item.id, originalTitle)}`}
                className="group flex-shrink-0 w-48 relative"
              >
                {/* Trending Badge */}
                {index < 10 && (
                  <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                    {index + 1}
                  </div>
                )}

                <div className="relative">
                  {/* Movie/TV Card */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-xl">
                    {/* Rating Badge */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm font-bold">
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 backdrop-blur-sm p-4 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <PlayIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Poster */}
                    <img
                      loading="lazy"
                      src={getPosterUrl(item.poster_path)}
                      alt={title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {formatDate(releaseDate, { year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Trending;
