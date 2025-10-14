import { FilmIcon, ClockIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/solid';
import type { Episode } from '../../types/tvSeasons';
import StatCard from './StatCard';

interface EpisodeStatisticsProps {
  episodes: Episode[];
}

function EpisodeStatistics({ episodes }: EpisodeStatisticsProps) {
  if (!episodes || episodes.length === 0) return null;

  // Calculate statistics
  const totalEpisodes = episodes.length;
  
  const avgRuntime = episodes.reduce((sum, ep) => sum + (ep.runtime || 0), 0) / episodes.length;
  
  const episodesWithRating = episodes.filter(ep => ep.vote_average && ep.vote_average > 0);
  const avgRating = episodesWithRating.length > 0
    ? episodesWithRating.reduce((sum, ep) => sum + (ep.vote_average || 0), 0) / episodesWithRating.length
    : 0;
  
  const highestRatedEpisode = episodesWithRating.length > 0
    ? episodesWithRating.reduce((highest, ep) => 
        (ep.vote_average || 0) > (highest.vote_average || 0) ? ep : highest
      )
    : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<FilmIcon />}
        label="Toplam Bölüm"
        value={totalEpisodes}
        gradient="from-blue-500 to-purple-500"
      />
      
      <StatCard
        icon={<ClockIcon />}
        label="Ort. Süre"
        value={avgRuntime > 0 ? `${Math.round(avgRuntime)} dk` : 'N/A'}
        gradient="from-purple-500 to-pink-500"
      />
      
      <StatCard
        icon={<StarIcon />}
        label="Ort. Puan"
        value={avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
        gradient="from-pink-500 to-rose-500"
      />
      
      <StatCard
        icon={<TrophyIcon />}
        label="En İyi Bölüm"
        value={highestRatedEpisode ? `Bölüm ${highestRatedEpisode.episode_number}` : 'N/A'}
        gradient="from-rose-500 to-orange-500"
      />
    </div>
  );
}

export default EpisodeStatistics;
