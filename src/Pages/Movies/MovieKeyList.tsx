import { Link, useLocation, useParams } from 'react-router-dom';
import { useGetMoviesByKeywordQuery } from '../../api/endpoints/movies.endpoints';
import { getPosterUrl, createSlug, formatDate, truncateText, extractIdFromSlug } from '../../utils';
import Loading from '../../components/Loading';

function MovieKeyList() {
  const { key_id } = useParams();
  const location = useLocation();
  const keywordId = extractIdFromSlug(key_id);

  // Extract label from URL path
  const pathParts = location.pathname.split('/')[2].split('-').slice(1);
  const label = pathParts.filter(part => part !== 'undefined').join(' ');

  const { data: movieKeyList, isLoading } = useGetMoviesByKeywordQuery(
    { keywordId: keywordId! },
    { skip: !keywordId }
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="w-full bg-cyan-900 p-5 mb-5">
        <div className="container mx-auto">
          <h1 className="flex justify-between items-center text-2xl md:text-3xl font-medium text-white">
            <span className="capitalize">{label || 'Keyword Filmleri'}</span>
            <span>{movieKeyList?.total_results || 0} film</span>
          </h1>
        </div>
      </div>

      {/* Movies List */}
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          {movieKeyList?.results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movie/${createSlug(movie.id, movie.original_title)}`}
              className="flex flex-col md:flex-row gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  loading="lazy"
                  className="h-48 w-32 md:h-36 md:w-24 rounded-md object-cover mx-auto"
                  src={getPosterUrl(movie.poster_path)}
                  alt={movie.title}
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <h2 className="text-xl md:text-2xl font-medium text-gray-100 group-hover:text-cyan-400 transition-colors">
                  {movie.title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {formatDate(movie.release_date)}
                </p>
                {movie.overview && (
                  <p className="leading-relaxed text-gray-300">
                    {truncateText(movie.overview, 260)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {movieKeyList?.results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Bu anahtar kelimeyle ilgili film bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieKeyList;
