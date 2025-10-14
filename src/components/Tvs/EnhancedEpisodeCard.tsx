import { memo } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, ClockIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import type { Episode } from '../../types/tvSeasons';
import { getPosterUrl, formatDate, formatDuration } from '../../utils';

interface EnhancedEpisodeCardProps {
  episode: Episode;
  tvId: string;
  seasonNumber: number;
}

const EnhancedEpisodeCard = memo(function EnhancedEpisodeCard({ 
  episode, 
  tvId, 
  seasonNumber 
}: EnhancedEpisodeCardProps) {
  // Get director and writer
  const director = episode.crew?.find(c => c.job === 'Director');
  const writer = episode.crew?.find(c => c.job === 'Writer' || c.job === 'Screenplay');

  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 
                    rounded-xl overflow-hidden hover:border-blue-500/50 
                    transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row gap-6 p-6">
        {/* Episode Still */}
        <div className="flex-shrink-0">
          <div className="relative w-full md:w-80 aspect-video rounded-lg overflow-hidden shadow-lg">
            <img
              src={getPosterUrl(episode.still_path)}
              alt={episode.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            
            {/* Episode Number Badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/80 backdrop-blur-lg 
                            rounded-lg border border-white/20">
              <span className="text-white font-bold text-lg">
                {episode.episode_number}
              </span>
            </div>

            {/* Rating Badge */}
            {episode.vote_average > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 
                              bg-black/80 backdrop-blur-lg rounded-lg">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-white text-sm font-bold">
                  {episode.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Episode Info */}
        <div className="flex-1 space-y-4">
          {/* Title and Meta */}
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-semibold text-white 
                           group-hover:text-blue-400 transition-colors duration-300">
              {episode.episode_number}. {episode.name}
            </h3>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {episode.air_date && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(episode.air_date)}</span>
                </div>
              )}
              
              {episode.runtime && (
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatDuration(episode.runtime)}</span>
                </div>
              )}

              {episode.vote_count && episode.vote_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{episode.vote_count.toLocaleString('tr-TR')} oy</span>
                </div>
              )}
            </div>
          </div>

          {/* Overview */}
          {episode.overview && (
            <p className="text-slate-300 leading-relaxed line-clamp-3">
              {episode.overview}
            </p>
          )}

          {/* Crew Info */}
          {(director || writer) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {director && (
                <div>
                  <span className="text-slate-400">Yönetmen: </span>
                  <Link 
                    to={`/person/${director.id}`}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {director.name}
                  </Link>
                </div>
              )}
              
              {writer && (
                <div>
                  <span className="text-slate-400">Yazar: </span>
                  <Link 
                    to={`/person/${writer.id}`}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {writer.name}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Guest Stars */}
          {episode.guest_stars && episode.guest_stars.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-400">
                Konuk Oyuncular:
              </h4>
              <div className="flex flex-wrap gap-2">
                {episode.guest_stars.slice(0, 6).map((star) => (
                  <Link
                    key={star.id}
                    to={`/person/${star.id}`}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 
                               border border-slate-600/50 hover:border-blue-500/50 
                               rounded-lg text-sm text-slate-300 hover:text-white 
                               transition-all duration-200"
                  >
                    {star.name}
                  </Link>
                ))}
                {episode.guest_stars.length > 6 && (
                  <span className="px-3 py-1.5 bg-slate-700/30 rounded-lg text-sm text-slate-400">
                    +{episode.guest_stars.length - 6} daha
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default EnhancedEpisodeCard;
