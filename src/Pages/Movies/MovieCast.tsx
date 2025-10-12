import { Link, useParams } from 'react-router-dom';
import { UserGroupIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { useGetMovieCreditsQuery } from '../../api/endpoints/movies.endpoints';
import { getProfileUrl, extractIdFromSlug } from '../../utils';
import MovieBanner from '../../components/Movies/MovieBanner';
import Loading from '../../components/Loading';

function MovieCast() {
  const { id } = useParams<{ id: string }>();
  const movieId = extractIdFromSlug(id);
  
  const { data: movieCredit, isLoading } = useGetMovieCreditsQuery(movieId!, {
    skip: !movieId,
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <MovieBanner />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cast Section */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-xl shadow-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Oyuncular
                </h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  {movieCredit?.cast.length} kişi
                </p>
              </div>
            </div>

            {/* Cast List */}
            <div className="space-y-3">
              {movieCredit?.cast.map((cast) => (
                <Link 
                  key={cast.id} 
                  to={`/person/${cast.id}`}
                  className="group"
                >
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-0 group-hover:opacity-50 blur transition-opacity duration-300" />
                      <img
                        loading="lazy"
                        className="relative w-16 h-20 object-cover rounded-lg shadow-lg"
                        src={getProfileUrl(cast.profile_path)}
                        alt={cast.name}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-lg group-hover:text-cyan-400 transition-colors truncate">
                        {cast.original_name}
                      </p>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {cast.character}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <svg
                      className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Crew Section */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-2.5 rounded-xl shadow-lg">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Ekip
                </h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  {movieCredit?.crew.length} kişi
                </p>
              </div>
            </div>

            {/* Crew List */}
            <div className="space-y-3">
              {movieCredit?.crew.map((crew) => (
                <Link 
                  key={`${crew.id}-${crew.credit_id}`} 
                  to={`/person/${crew.id}`}
                  className="group"
                >
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl hover:border-purple-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-0 group-hover:opacity-50 blur transition-opacity duration-300" />
                      <img
                        loading="lazy"
                        className="relative w-16 h-20 object-cover rounded-lg shadow-lg"
                        src={getProfileUrl(crew.profile_path)}
                        alt={crew.name}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-lg group-hover:text-purple-400 transition-colors truncate">
                        {crew.original_name}
                      </p>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {crew.job}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <svg
                      className="w-5 h-5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCast;
