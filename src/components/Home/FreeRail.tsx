import { useGetFreeToWatchMoviesQuery } from '@api/endpoints/movies.endpoints'
import { useRegion } from '@hooks/useRegion'
import { PosterCard } from '@components/ui'
import { movieResultToSummary } from './mapToSummary'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 14

/**
 * "Ücretsiz İzle" (spec §6, fixes H+I): discover + with_watch_monetization_types=free,
 * region ZORUNLU ve useRegion() kaynaklı. Sağlayıcı verisi gösterildiği için
 * JustWatch atfı ray altında verilir (D7).
 */
export function FreeRail({ className = '' }: { className?: string }) {
  const { region, regions } = useRegion()
  const { data, isLoading, isError, refetch } = useGetFreeToWatchMoviesQuery({ region })

  const items = (data?.results ?? []).map(movieResultToSummary).slice(0, RAIL_LIMIT)
  const regionName = regions?.find((option) => option.iso_3166_1 === region)?.native_name ?? region

  return (
    <RailSection
      title="Ücretsiz İzle"
      eyebrow="JustWatch"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      footer={
        <p className="mt-3 text-xs text-secondary">
          {regionName} bölgesinde ücretsiz içerikler · JustWatch verileriyle
        </p>
      }
      renderItem={(item) => <PosterCard key={`movie-${item.id}`} item={item} />}
    />
  )
}
