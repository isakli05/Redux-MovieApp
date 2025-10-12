import { useState } from 'react';
import { useDiscoverMoviesQuery } from '../../api/endpoints/movies.endpoints';
import MovieCarousel from '../Carousel/MovieCarousel';
import '../Carousel/carousel.css';

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

      {/* Movies Carousel */}
      <MovieCarousel
        movies={popular?.results || []}
        isLoading={isLoading}
        mediaType="movie"
        color="cyan"
      />
    </section>
  );
}

export default Popular;
