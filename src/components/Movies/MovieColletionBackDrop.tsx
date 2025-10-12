import { Link } from 'react-router-dom';
import { useGetMovieCollectionQuery } from '../../api/endpoints/movies.endpoints';
import { getBackdropUrl, slugify } from '../../utils';

type MovieCollectionProps = {
  id?: number;
  title?: string;
};

function MovieColletionBackDrop({ id, title }: MovieCollectionProps) {
  const { data: movieCollect, isLoading } = useGetMovieCollectionQuery(String(id), {
    skip: !id,
  });

  if (isLoading) {
    return (
      <div className="mt-10 relative h-96 bg-slate-700 rounded-lg animate-pulse">
        <div className="absolute top-1/4 left-4 space-y-4">
          <div className="h-8 w-64 bg-slate-600 rounded" />
          <div className="h-6 w-96 bg-slate-600 rounded" />
          <div className="h-10 w-48 bg-slate-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!movieCollect) return null;

  return (
    <div className="mt-10 relative">
      <figure className="w-full opacity-30">
        <img
          loading="lazy"
          src={getBackdropUrl(movieCollect.backdrop_path)}
          className="w-full h-96 md:h-64 object-top object-cover rounded-lg"
          alt={movieCollect.name}
        />
      </figure>

      <div className="w-full p-4 absolute top-1/4">
        <h1 className="text-slate-300 text-xl lg:text-3xl font-semibold leading-tight mb-2">
          {movieCollect.name} koleksiyonunun bir parçası
        </h1>
        <p className="text-slate-300 mb-6 w-11/12 text-sm lg:text-base">
          {movieCollect.parts.slice(0, 5).map((part, index) => (
            <span key={part.id}>
              {part.title}
              {index < Math.min(movieCollect.parts.length, 5) - 1 ? ', ' : ''}
            </span>
          ))}
          {movieCollect.parts.length > 5 && ` ve ${movieCollect.parts.length - 5} film daha`} içerir.
        </p>
        <Link
          to={`/collection/${id}-${slugify(title || movieCollect.name)}-collection`}
          className="bg-slate-600 hover:bg-slate-800 px-6 py-2 lg:py-3 font-semibold text-white text-sm lg:text-md rounded-full inline-block transition-colors"
        >
          KOLEKSİYONU GÖRÜNTÜLE
        </Link>
      </div>
    </div>
  );
}

export default MovieColletionBackDrop;
