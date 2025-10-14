import { TvIcon, FilmIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/solid';
import type { Season } from '../../types/tvsDetails';
import { calculateSeasonStats } from '../../utils/seasonStats';
import StatCard from './StatCard';

interface StatsOverviewProps {
  seasons: Season[];
}

function StatsOverview({ seasons }: StatsOverviewProps) {
  const stats = calculateSeasonStats(seasons);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<TvIcon />}
        label="Toplam Sezon"
        value={stats.totalSeasons}
        gradient="from-cyan-500 to-blue-500"
      />
      
      <StatCard
        icon={<FilmIcon />}
        label="Toplam Bölüm"
        value={stats.totalEpisodes}
        gradient="from-blue-500 to-purple-500"
      />
      
      <StatCard
        icon={<StarIcon />}
        label="Ortalama Puan"
        value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
        gradient="from-purple-500 to-pink-500"
      />
      
      <StatCard
        icon={<TrophyIcon />}
        label="En İyi Sezon"
        value={stats.highestRatedSeason 
          ? `Sezon ${stats.highestRatedSeason.season_number}` 
          : 'N/A'
        }
        gradient="from-pink-500 to-rose-500"
      />
    </div>
  );
}

export default StatsOverview;
