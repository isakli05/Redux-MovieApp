import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDiscoverMoviesQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

type WatchType = 'with_watch_monetization_types=flatrate' | 'with_watch_monetization_types=rent' | 'with_watch_monetization_type=3|2';

function Popular() {
  const [watchType, setWatchType] = useState<WatchType>('with_watch_monetization_types=flatrate');
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: popular, isLoading } = useDiscoverMoviesQuery({ watchType });

  const handleClick = (index: number, type: WatchType) => {
    setWatchType(type);
    setActiveIndex(index);
  };

  const buttonClasses = (isActive: boolean) => `
    ${isActive ? 'bg-cyan-400 transition duration-500 ease-linear' : 'bg-white'}
    p-2 md:px-4 md:py-2 text-xs lg:text-sm font-medium text-gray-900 border border-gray-200 
    dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-cyan-300 transition-colors
  `;

  return (
    <div>
      <div className="flex m-5">
        <h3 className="mr-3 lg:mr-6 lg:text-2xl text-sm md:text-xl text-left text-zinc-300 font-semibold w-14 lg:w-max">
          What's Popular
        </h3>
        <div className="flex-col lg:text-2xl rounded-xl shadow-sm" role="group">
          <button
            onClick={() => handleClick(0, 'with_watch_monetization_types=flatrate')}
            className={`${buttonClasses(activeIndex === 0)} rounded-l-xl`}
            aria-pressed={activeIndex === 0}
          >
            Streaming
          </button>
          <button
            onClick={() => handleClick(2, 'with_watch_monetization_types=rent')}
            className={buttonClasses(activeIndex === 2)}
            aria-pressed={activeIndex === 2}
          >
            For Rent
          </button>
          <button
            onClick={() => handleClick(3, 'with_watch_monetization_type=3|2')}
            className={`${buttonClasses(activeIndex === 3)} rounded-r-xl`}
            aria-pressed={activeIndex === 3}
          >
            In Theaters
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
            {popular?.results.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${createSlug(movie.id, movie.original_title)}`}
              >
                <li className="flex flex-col w-40 gap-2 shadow rounded-lg mb-2 hover:scale-105 transition-transform duration-200">
                  <figure className="flex flex-col space-y-2">
                    <img
                      loading="lazy"
                      className="h-56 w-36 object-cover object-top rounded-md"
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                    />
                    <p className="mt-2 w-28 text-gray-100 text-md font-medium truncate">
                      {movie.title}
                    </p>
                    <p className="mt-1 w-28 text-slate-400 text-sm">
                      {formatDate(movie.release_date, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </figure>
                </li>
              </Link>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Popular;
