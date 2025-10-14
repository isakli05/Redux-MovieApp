import { memo } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, FilmIcon, CalendarIcon, PlayIcon } from '@heroicons/react/24/solid';
import type { Season } from '../../types/tvsDetails';
import type { SeasonVideo } from '../../types/seasonVideos';
import type { SeasonCastMember } from '../../types/seasonCredits';
import { getPosterUrl, formatDate } from '../../utils';
import SeasonCastPreview from './SeasonCastPreview';

interface SeasonCardProps {
  season: Season;
  tvId: string;
  tvName: string;
  videos?: SeasonVideo[];
  cast?: SeasonCastMember[];
  isLoading?: boolean;
  onTrailerClick?: (video: SeasonVideo) => void;
}

const SeasonCard = memo(function SeasonCard({ 
  season, 
  tvId, 
  tvName, 
  videos, 
  cast, 
  isLoading,
  onTrailerClick 
}: SeasonCardProps) {
  // Find the best trailer
  const trailer = videos?.find(v => v.type === 'Trailer') || videos?.[0];
  
  // Determine if season is completed (simple heuristic)
  const isCompleted = season.air_date && new Date(season.air_date) < new Date();

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-800/50 backdrop-blur-lg 
                      border border-slate-700/50 rounded-xl animate-pulse">
        <div className="flex-shrink-0">
          <div className="w-32 md:w-40 h-48 md:h-60 bg-slate-700/50 rounded-lg" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-3/4" />
          <div className="h-4 bg-slate-700/50 rounded w-1/2" />
          <div className="h-20 bg-slate-700/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col md:flex-row gap-6 p-6 bg-slate-800/50 backdrop-blur-lg 
                    border border-slate-700/50 rounded-xl hover:border-cyan-500/50 
                    transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 
                      opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 pointer-events-none" />
      
      {/* Season Poster */}
      <Link
        to={`/tv/${tvId}/season/${season.season_number}`}
        className="relative flex-shrink-0 mx-auto md:mx-0 will-change-auto"
      >
        <img
          loading="lazy"
          className="w-32 md:w-40 h-48 md:h-60 rounded-lg object-cover shadow-lg 
                     group-hover:shadow-2xl group-hover:shadow-cyan-500/10 
                     transition-shadow duration-300"
          src={getPosterUrl(season.poster_path, 'MEDIUM')}
          alt={season.name}
        />
        
        {/* Status Badge */}
        {isCompleted ? (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 backdrop-blur-lg 
                          border border-green-500/30 rounded-full">
            <span className="text-green-400 text-xs font-semibold">Tamamlandı</span>
          </div>
        ) : (
          <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/20 backdrop-blur-lg 
                          border border-blue-500/30 rounded-full">
            <span className="text-blue-400 text-xs font-semibold">Devam Ediyor</span>
          </div>
        )}
      </Link>

      {/* Season Info */}
      <div className="relative flex-1 space-y-4">
        {/* Title and Stats */}
        <div className="space-y-2">
          <Link
            to={`/tv/${tvId}/season/${season.season_number}`}
            className="block"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-gray-100 
                           group-hover:text-cyan-400 transition-colors duration-300">
              {season.name}
            </h2>
          </Link>
          
          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Rating */}
            {season.vote_average && season.vote_average > 0 && (
              <div className="flex items-center gap-1.5">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-semibold">{season.vote_average.toFixed(1)}</span>
                {season.vote_count && (
                  <span className="text-slate-400">({season.vote_count.toLocaleString('tr-TR')})</span>
                )}
              </div>
            )}
            
            {/* Air Date */}
            {season.air_date && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <CalendarIcon className="h-4 w-4" />
                <span>{season.air_date.slice(0, 4)}</span>
              </div>
            )}
            
            {/* Episode Count */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <FilmIcon className="h-4 w-4" />
              <span>{season.episode_count} Bölüm</span>
            </div>
          </div>
        </div>

        {/* Overview */}
        <p className="leading-relaxed text-gray-300 line-clamp-3">
          {season.overview || 
            `${tvName} ${season.season_number}. Sezon ${
              season.air_date ? formatDate(season.air_date) : ''
            }'de gösterime girdi.`
          }
        </p>

        {/* Cast Preview */}
        {cast && cast.length > 0 && (
          <SeasonCastPreview cast={cast} maxVisible={5} />
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {trailer && onTrailerClick && (
            <button
              onClick={() => onTrailerClick(trailer)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 
                         border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg 
                         text-cyan-400 font-semibold transition-all duration-200 
                         hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95"
            >
              <PlayIcon className="h-4 w-4" />
              <span>Fragman İzle</span>
            </button>
          )}
          
          <Link
            to={`/tv/${tvId}/season/${season.season_number}`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 
                       border border-slate-600/50 hover:border-slate-500 rounded-lg 
                       text-slate-300 hover:text-white font-semibold transition-all duration-200 
                       active:scale-95"
          >
            <span>Detayları Gör</span>
          </Link>
        </div>
      </div>
    </div>
  );
});

export default SeasonCard;
