import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetFreeMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { useGetFreeTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';
import type { Result } from '../../types/Movies';

type MediaType = 'movie' | 'tv';

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

  const buttonClasses = (isActive: boolean) => `
    ${isActive ? 'bg-cyan-400 transition duration-500 ease-linear' : 'bg-white'}
    px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 
    dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-cyan-300 transition-colors
  `;

  return (
    <div>
      <div className="flex m-5 mt-20">
        <h3 className="mr-6 text-2xl text-left text-zinc-300 font-semibold">
          Free To Watch
        </h3>
        <div className="flex-col rounded-xl shadow-sm" role="group">
          <button
            onClick={() => handleClick(0, 'movie')}
            className={`${buttonClasses(activeIndex === 0)} rounded-l-xl`}
            aria-pressed={activeIndex === 0}
          >
            Movies
          </button>
          <button
            onClick={() => handleClick(1, 'tv')}
            className={`${buttonClasses(activeIndex === 1)} rounded-r-xl`}
            aria-pressed={activeIndex === 1}
          >
            TV
          </button>
        </div>
      </div>

      <div className="m-5">
        {isLoading ? (
          <ul className="flex overflow-x-auto overflow-y-hidden gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <li key={index} className="flex flex-col w-40 gap-2 animate-pulse">
                <div className="h-56 w-36 bg-slate-700 rounded-md" />
                <div className="h-4 w-28 bg-slate-700 rounded" />
                <div className="h-3 w-20 bg-slate-700 rounded" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex overflow-x-auto overflow-y-hidden gap-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {results?.map((item: any) => {
              const title = type === 'tv' ? item.name : item.title;
              const originalTitle = type === 'tv' ? item.original_name : item.original_title;
              const releaseDate = type === 'tv' ? item.first_air_date : item.release_date;

              return (
                <Link
                  key={item.id}
                  to={`/${type}/${createSlug(item.id, originalTitle)}`}
                >
                  <li className="flex flex-col w-40 gap-2 shadow rounded-lg mb-2 hover:scale-105 transition-transform duration-200">
                    <figure className="flex flex-col space-y-2">
                      <img
                        loading="lazy"
                        className="h-56 w-36 object-cover object-top rounded-md"
                        src={getPosterUrl(item.poster_path)}
                        alt={title}
                      />
                      <p className="mt-2 w-28 text-slate-100 text-md font-medium truncate">
                        {title}
                      </p>
                      <p className="mt-1 w-28 text-slate-400 text-sm">
                        {formatDate(releaseDate, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </figure>
                  </li>
                </Link>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Free;
