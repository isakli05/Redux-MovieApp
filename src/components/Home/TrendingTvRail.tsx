import { useGetTrendingMixedQuery } from '@api/endpoints/movies.endpoints'
import { PosterCard } from '@components/ui'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 14

/**
 * "Dizilerde Trend" (spec §6): trending/all week sonuçlarından yalnızca
 * diziler — Bugün Trend (day/all) rayından farklı pencere ve farklı içerik.
 * Tek istek HomeHero+TrendingRail'in day sorgusuyla ayrı cache'lenir.
 */
export function TrendingTvRail({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGetTrendingMixedQuery({ timeWindow: 'week' })

  const items = (data?.results ?? [])
    .filter((item) => item.media_type === 'tv')
    .slice(0, RAIL_LIMIT)

  return (
    <RailSection
      title="Dizilerde Trend"
      eyebrow="Bu Hafta"
      linkTo="/tv"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      renderItem={(item) => <PosterCard key={`tv-${item.id}`} item={item} />}
    />
  )
}
