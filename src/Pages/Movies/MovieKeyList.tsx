import { Link, useLocation, useParams } from 'react-router-dom';
import { TagIcon, StarIcon, CalendarIcon, FilmIcon } from '@heroicons/react/24/outline';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/50">
                  <TagIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent capitalize">
                  {label || 'Keyword Filmleri'}
                </h1>
                <p className="text-slate-400 mt-1">
                  Anahtar kelimeyle etiketlenmiş filmler
                </p>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl px-6 py-3 flex items-center gap-3 w-fit">
              <FilmIcon className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="text-sm text-slate-400">Toplam Film</p>
                <p className="text-2xl font-bold text-white">{movieKeyList?.total_results || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movies List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {movieKeyList?.results && movieKeyList.results.length > 0 ? (
          <div className="space-y-4">
            {movieKeyList.results.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${createSlug(movie.id, movie.original_title)}`}
                className="group block"
              >
                <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10">
                  {/* Poster */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-50 blur transition-opacity duration-300" />
                      <img
                        loading="lazy"
                        className="relative h-56 w-36 md:h-44 md:w-28 rounded-xl object-cover shadow-2xl"
                        src={getPosterUrl(movie.poster_path)}
                        alt={movie.title}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Title and Rating */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                          {movie.title}
                        </h2>
                        {movie.vote_average > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg flex-shrink-0">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-bold text-sm">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Release Date */}
                      {movie.release_date && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDate(movie.release_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overview */}
                    {movie.overview && (
                      <p className="text-slate-300 leading-relaxed line-clamp-3">
                        {truncateText(movie.overview, 260)}
                      </p>
                    )}

                    {/* View Details Link */}
                    <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm pt-2">
                      <span>Detayları Görüntüle</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-full p-8">
              <FilmIcon className="h-16 w-16 text-slate-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Film Bulunamadı</h3>
              <p className="text-slate-400 max-w-md">
                Bu anahtar kelimeyle etiketlenmiş film bulunmamaktadır.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieKeyList;
