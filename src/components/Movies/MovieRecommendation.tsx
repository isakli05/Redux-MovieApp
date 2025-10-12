import { Link } from 'react-router-dom';
import { useGetMovieRecommendationsQuery } from '../../api/endpoints/movies.endpoints';
import { getBackdropUrl, createSlug, extractIdFromSlug } from '../../utils';

type MovieRecommendationProps = {
  id?: string;
};

function MovieRecommendation({ id }: MovieRecommendationProps) {
  const movieId = extractIdFromSlug(id);
  const { data: recommendations, isLoading } = useGetMovieRecommendationsQuery(movieId!, {
    skip: !movieId,
  });

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="mb-4 text-2xl text-left text-zinc-300 font-semibold">
          Tavsiyeler
        </h3>
        <ul className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex flex-col w-72 shadow rounded-lg animate-pulse">
              <div className="h-40 w-72 bg-slate-700 rounded-md" />
              <div className="p-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!recommendations?.results.length) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-2xl text-left text-zinc-300 font-semibold">
        Tavsiyeler
      </h3>
      <ul className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {recommendations.results.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${createSlug(movie.id, movie.original_title)}`}
          >
            <li className="flex flex-col w-72 shadow rounded-lg mb-2 hover:scale-105 transition-transform duration-200">
              <figure className="flex flex-col space-y-2">
                <img
                  className="h-40 w-72 object-cover object-center rounded-md"
                  src={getBackdropUrl(movie.backdrop_path)}
                  alt={movie.title}
                  loading="lazy"
                />
                <p className="mt-2 px-2 pb-2 w-70 truncate text-slate-300 text-md font-medium">
                  {movie.title}
                </p>
              </figure>
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}

export default MovieRecommendation;
