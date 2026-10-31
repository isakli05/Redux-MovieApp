import { TvIcon, FilmIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/solid'
import type { Season } from '../../types/tvsDetails'
import { calculateSeasonStats } from '../../utils/seasonStats'
import StatCard from './StatCard'

interface StatsOverviewProps {
  seasons: Season[]
}

function StatsOverview({ seasons }: StatsOverviewProps) {
  const stats = calculateSeasonStats(seasons)

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard icon={<TvIcon className="h-5 w-5" />} label="Toplam Sezon" value={stats.totalSeasons} />

      <StatCard icon={<FilmIcon className="h-5 w-5" />} label="Toplam Bölüm" value={stats.totalEpisodes} />

      <StatCard
        icon={<StarIcon className="h-5 w-5" />}
        label="Ortalama Puan"
        value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
      />

      <StatCard
        icon={<TrophyIcon className="h-5 w-5" />}
        label="En İyi Sezon"
        value={stats.highestRatedSeason ? `${stats.highestRatedSeason.season_number}. Sezon` : '—'}
      />
    </div>
  )
}

export default StatsOverview
