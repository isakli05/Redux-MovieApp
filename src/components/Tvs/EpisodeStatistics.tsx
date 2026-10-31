import { FilmIcon, ClockIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/solid'
import type { Episode } from '../../types/tvSeasons'
import StatCard from './StatCard'

interface EpisodeStatisticsProps {
  episodes: Episode[]
}

function EpisodeStatistics({ episodes }: EpisodeStatisticsProps) {
  if (!episodes || episodes.length === 0) return null

  // İstatistikler yalnızca yayımlanmış bölümlerden hesaplanır (spoiler-safe):
  // henüz yayınlanmamış bölümlerin puanı/süresi genelde boştur ve ortalamayı düşürür.
  const aired = episodes.filter((ep) => ep.air_date && new Date(ep.air_date).getTime() <= Date.now())
  const pool = aired.length > 0 ? aired : episodes

  const totalEpisodes = episodes.length

  const runtimes = pool.filter((ep) => ep.runtime && ep.runtime > 0)
  const avgRuntime =
    runtimes.length > 0 ? runtimes.reduce((sum, ep) => sum + (ep.runtime || 0), 0) / runtimes.length : 0

  const episodesWithRating = pool.filter((ep) => ep.vote_average && ep.vote_average > 0)
  const avgRating =
    episodesWithRating.length > 0
      ? episodesWithRating.reduce((sum, ep) => sum + (ep.vote_average || 0), 0) / episodesWithRating.length
      : 0

  const highestRatedEpisode =
    episodesWithRating.length > 0
      ? episodesWithRating.reduce((highest, ep) =>
          (ep.vote_average || 0) > (highest.vote_average || 0) ? ep : highest,
        )
      : null

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard icon={<FilmIcon className="h-5 w-5" />} label="Toplam Bölüm" value={totalEpisodes} />

      <StatCard
        icon={<ClockIcon className="h-5 w-5" />}
        label="Ort. Süre"
        value={avgRuntime > 0 ? `${Math.round(avgRuntime)} dk` : '—'}
      />

      <StatCard
        icon={<StarIcon className="h-5 w-5" />}
        label="Ort. Puan"
        value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
      />

      <StatCard
        icon={<TrophyIcon className="h-5 w-5" />}
        label="En İyi Bölüm"
        value={highestRatedEpisode ? `${highestRatedEpisode.episode_number}. Bölüm` : '—'}
      />
    </div>
  )
}

export default EpisodeStatistics
