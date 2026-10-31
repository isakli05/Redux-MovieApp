import { useGetTrendingMixedQuery } from '@api/endpoints/movies.endpoints'
import { PosterCard } from '@components/ui'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 14

/** "Bugün Trend" (spec §6): trending/all day — normalize edilmiş karma ray. */
export function TrendingRail({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGetTrendingMixedQuery({ timeWindow: 'day' })

  const items = (data?.results ?? []).slice(0, RAIL_LIMIT)

  return (
    <RailSection
      title="Bugün Trend"
      eyebrow="Trending"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      renderItem={(item) => (
        <PosterCard key={`${item.media_type}-${item.id}`} item={item} showMediaType />
      )}
    />
  )
}
