import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, GiftIcon } from '@heroicons/react/24/solid';
import { useGetFreeMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { useGetFreeTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

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
    <section className="relative">
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

      {/* Content Grid */}
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
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-500/50 scrollbar-track-slate-800/50">
          {results?.map((item: any) => {
            const title = type === 'tv' ? item.name : item.title;
            const originalTitle = type === 'tv' ? item.original_name : item.original_title;
            const releaseDate = type === 'tv' ? item.first_air_date : item.release_date;

            return (
              <Link
                key={item.id}
                to={`/${type}/${createSlug(item.id, originalTitle)}`}
                className="group flex-shrink-0 w-48"
              >
                <div className="relative">
                  {/* Card */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-xl">
                    {/* Free Badge */}
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                      <GiftIcon className="h-3 w-3" />
                      ÜCRETSİZ
                    </div>

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
                        <div className="bg-green-500/90 backdrop-blur-sm p-4 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
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
                    <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-tight">
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

export default Free;
