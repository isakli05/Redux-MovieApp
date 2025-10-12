import { useState } from 'react';
import { FireIcon } from '@heroicons/react/24/solid';
import { useGetTrendingQuery } from '../../api/endpoints/movies.endpoints';
import MovieCarousel from '../Carousel/MovieCarousel';
import '../Carousel/carousel.css';

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
    <section className="relative carousel-orange">
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

      {/* Trending Carousel */}
      <MovieCarousel
        movies={trending?.results || []}
        isLoading={isLoading}
        mediaType="movie"
        color="orange"
      />
    </section>
  );
}

export default Trending;
