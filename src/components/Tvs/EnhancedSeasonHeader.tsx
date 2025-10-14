import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  StarIcon, 
  FilmIcon,
  CalendarIcon 
} from '@heroicons/react/24/solid';
import type { TvSeasons } from '../../types/tvSeasons';
import type { TvDetails } from '../../types/tvsDetails';
import { getPosterUrl, formatDate } from '../../utils';

interface EnhancedSeasonHeaderProps {
  seasonDetail: TvSeasons;
  tvDetail: TvDetails;
  tvId: string;
  seasonNumber: number;
}

function EnhancedSeasonHeader({ 
  seasonDetail, 
  tvDetail, 
  tvId, 
  seasonNumber 
}: EnhancedSeasonHeaderProps) {
  const canGoPrevious = seasonNumber > 1;
  const canGoNext = seasonNumber < tvDetail.number_of_seasons;

  // Calculate average episode rating
  const avgRating = seasonDetail.episodes?.length > 0
    ? seasonDetail.episodes.reduce((sum, ep) => sum + (ep.vote_average || 0), 0) / seasonDetail.episodes.length
    : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
      {/* Decorative blur circles */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Back to Seasons Link */}
        <Link 
          to={`/tv/${tvId}/seasons`}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-cyan-400 
                     transition-colors mb-6 group"
        >
          <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Sezon Listesine Dön</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Season Poster */}
          <div className="flex-shrink-0">
            <img
              src={getPosterUrl(seasonDetail.poster_path, 'LARGE')}
              alt={seasonDetail.name}
              className="w-48 md:w-64 lg:w-72 rounded-xl shadow-2xl mx-auto lg:mx-0"
              loading="lazy"
            />
          </div>

          {/* Season Info */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {seasonDetail.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                {seasonDetail.air_date && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                    <span>{formatDate(seasonDetail.air_date, { year: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FilmIcon className="h-5 w-5 text-slate-400" />
                  <span>{seasonDetail.episodes?.length || 0} Bölüm</span>
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overview */}
            {seasonDetail.overview && (
              <p className="text-slate-300 leading-relaxed text-lg max-w-3xl">
                {seasonDetail.overview}
              </p>
            )}

            {/* Season Navigation */}
            <div className="flex gap-4 pt-4">
              {canGoPrevious && (
                <Link
                  to={`/tv/${tvId}/season/${seasonNumber - 1}`}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 
                             border border-slate-600/50 hover:border-slate-500 rounded-lg 
                             text-white font-semibold transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Sezon {seasonNumber - 1}</span>
                </Link>
              )}
              
              {canGoNext && (
                <Link
                  to={`/tv/${tvId}/season/${seasonNumber + 1}`}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 
                             border border-slate-600/50 hover:border-slate-500 rounded-lg 
                             text-white font-semibold transition-all duration-200"
                >
                  <span>Sezon {seasonNumber + 1}</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedSeasonHeader;
