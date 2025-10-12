import { Link, useParams } from 'react-router-dom';
import { useGetMovieCollectionQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, getBackdropUrl, createSlug, formatDate, extractIdFromSlug } from '../../utils';
import Loading from '../../components/Loading';

function MovieCollection() {
  const { coll_id } = useParams();
  const collectionId = extractIdFromSlug(coll_id);

  const { data: movieCollect, isLoading, error } = useGetMovieCollectionQuery(collectionId!, {
    skip: !collectionId,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">Koleksiyon yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (isLoading || !movieCollect) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with Backdrop */}
      <div className="relative flex flex-col md:flex-row items-center px-4 py-8 text-slate-100">
        {/* Poster */}
        <img
          loading="lazy"
          src={getPosterUrl(movieCollect.poster_path)}
          alt={movieCollect.name}
          className="hidden md:block w-60 h-96 z-10 absolute left-8 object-cover rounded-lg shadow-2xl"
        />

        {/* Backdrop */}
        <figure className="w-full opacity-30">
          <img
            loading="lazy"
            src={getBackdropUrl(movieCollect.backdrop_path)}
            className="w-full h-[400px] object-cover rounded-lg"
            alt={movieCollect.name}
          />
        </figure>

        {/* Collection Info */}
        <div className="absolute left-4 md:left-80 p-4 space-y-4 max-w-3xl">
          <h1 className="text-3xl lg:text-5xl font-bold text-zinc-100">
            {movieCollect.name}
          </h1>
          <p className="text-slate-200 text-lg leading-relaxed hidden md:block">
            {movieCollect.overview || 'Koleksiyon açıklaması bulunmuyor.'}
          </p>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-zinc-300 mb-6">
          Koleksiyondaki Filmler ({movieCollect.parts.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...movieCollect.parts]
            .sort((a, b) => {
              const dateA = new Date(a.release_date || '').getTime();
              const dateB = new Date(b.release_date || '').getTime();
              return dateA - dateB;
            })
            .map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${createSlug(movie.id, movie.original_title)}`}
                className="group"
              >
                <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <img
                    loading="lazy"
                    src={getPosterUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {formatDate(movie.release_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {movie.overview && (
                      <p className="text-slate-500 text-sm line-clamp-3">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

export default MovieCollection;
