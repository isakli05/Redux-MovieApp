import { useDiscoverMoviesQuery } from '@api/endpoints/movies.endpoints'
import { PosterCard } from '@components/ui'
import { movieResultToSummary } from './mapToSummary'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 12

/**
 * Eleştirmenlerin Seçtikleri (spec §6): discover movie —
 * vote_count.gte=1000 + vote_average.gte=7.5, vote_average.desc sıralı.
 * Not: API katmanına özel bir endpoint eklenmediği için mevcut genel
 * discover passthrough'u bu filtre dizisiyle kullanılır (API read-only).
 */
const CRITICS_FILTER =
  'vote_count.gte=1000&vote_average.gte=7.5&sort_by=vote_average.desc'

export function CriticsRail({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useDiscoverMoviesQuery({ watchType: CRITICS_FILTER })

  const items = (data?.results ?? []).map(movieResultToSummary).slice(0, RAIL_LIMIT)

  return (
    <RailSection
      title="Eleştirmenlerin Seçtikleri"
      eyebrow="En İyiler"
      linkTo="/movie"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      renderItem={(item) => <PosterCard key={`movie-${item.id}`} item={item} />}
    />
  )
}
