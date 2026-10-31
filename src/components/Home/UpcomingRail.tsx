import { useGetUpcomingMoviesQuery } from '@api/endpoints/movies.endpoints'
import { PosterCard } from '@components/ui'
import { movieResultToSummary } from './mapToSummary'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 14

/** "Yakında" (spec §6): /movie/upcoming rayı. */
export function UpcomingRail({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGetUpcomingMoviesQuery(1)

  const items = (data?.results ?? []).map(movieResultToSummary).slice(0, RAIL_LIMIT)

  return (
    <RailSection
      title="Yakında"
      eyebrow="Sinema"
      linkTo="/movie/upcoming"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      renderItem={(item) => <PosterCard key={`movie-${item.id}`} item={item} />}
    />
  )
}
