import { useState } from 'react';
import { GiftIcon } from '@heroicons/react/24/solid';
import { useGetFreeMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { useGetFreeTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import MovieCarousel from '../Carousel/MovieCarousel';
import '../Carousel/carousel.css';

type MediaType = 'movie' | 'tv';

const mediaOptions = [
  { id: 0, label: 'Filmler', value: 'movie' as MediaType },
  { id: 1, label: 'Diziler', value: 'tv' as MediaType },
];

function Free() {
  const [type, setType] = useState<MediaType>('movie');
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: freeMovies, isLoading: moviesLoading } = useGetFreeMoviesQuery(undefined, {
    skip: type !== 'movie',
  });

  const { data: freeTVShows, isLoading: tvLoading } = useGetFreeTVShowsQuery(undefined, {
    skip: type !== 'tv',
  });

  const handleClick = (index: number, mediaType: MediaType) => {
    setType(mediaType);
    setActiveIndex(index);
  };

  const isLoading = type === 'movie' ? moviesLoading : tvLoading;
  const results = type === 'movie' ? freeMovies?.results : freeTVShows?.results;

  return (
    <section className="relative carousel-green">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <GiftIcon className="h-8 w-8 text-green-400" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Ücretsiz İçerikler
            </h2>
          </div>
          <p className="text-slate-400">Tamamen ücretsiz izleyebileceğiniz içerikler</p>
        </div>

        {/* Media Type Tabs */}
        <div className="flex gap-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-1.5 rounded-xl">
          {mediaOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleClick(option.id, option.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${activeIndex === option.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Carousel */}
      <MovieCarousel
        movies={results || []}
        isLoading={isLoading}
        mediaType={type}
        color="green"
      />
    </section>
  );
}

export default Free;
