import { Link, useParams } from 'react-router-dom';
import { useGetMovieDetailsQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, extractIdFromSlug, getYear } from '../../utils';

function MovieBanner() {
  const { id } = useParams();
  const movieId = extractIdFromSlug(id);
  const { data: movie, isLoading } = useGetMovieDetailsQuery(movieId!, {
    skip: !movieId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center p-2 sm:p-5 h-32 my-5 bg-slate-600 animate-pulse">
        <div className="flex items-center md:ml-12">
          <div className="w-16 h-20 bg-slate-700 rounded mr-2" />
          <div className="ml-2 space-y-2">
            <div className="h-8 w-64 bg-slate-700 rounded" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="flex items-center p-2 sm:p-5 h-32 my-5 bg-slate-600">
      <Link to={`/movie/${id}`}>
        <div className="flex items-center md:ml-12 group">
          <img
            loading="lazy"
            className="w-16 h-20 object-cover rounded shadow-md"
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title}
          />

          <div className="ml-4">
            <h3 className="font-semibold text-xl md:text-3xl text-gray-100 group-hover:text-gray-300 transition-colors">
              {movie.original_title}{' '}
              <span className="md:text-2xl font-light">
                ({getYear(movie.release_date)})
              </span>
            </h3>
            <span className="text-gray-100 group-hover:text-slate-300 text-sm md:text-base transition-colors">
              <i className="fa-solid fa-arrow-left mr-2 text-sm"></i>
              Sayfaya Dön
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default MovieBanner;
