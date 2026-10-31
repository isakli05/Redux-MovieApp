import { useDiscoverMoviesQuery } from '@api/endpoints/movies.endpoints'
import { PosterCard } from '@components/ui'
import { movieResultToSummary } from './mapToSummary'
import { RailSection } from './RailSection'

const RAIL_LIMIT = 12

/**
 * Gizli Cevherler (spec §6): discover movie — puan 7.5+, 300–1500 oy aralığı,
 * popularity.asc (az bilenden çok bilene). Kriterler UI'da Türkçe açıklanır;
 * "gizemli" algoritma yok.
 */
const HIDDEN_GEMS_FILTER =
  'vote_average.gte=7.5&vote_count.gte=300&vote_count.lte=1500&sort_by=popularity.asc'

export function HiddenGemsRail({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useDiscoverMoviesQuery({ watchType: HIDDEN_GEMS_FILTER })

  const items = (data?.results ?? []).map(movieResultToSummary).slice(0, RAIL_LIMIT)

  return (
    <RailSection
      title="Gizli Cevherler"
      eyebrow="Keşfet"
      linkTo="/movie"
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      className={className}
      footer={
        <p className="mt-3 text-xs leading-relaxed text-secondary">
          Kriter: TMDB puanı 7,5 ve üzeri · 300–1.500 arasında oy · popülerliği artan sırada
          listelenmiş, az bilinen ama beğenilen yapımlar.
        </p>
      }
      renderItem={(item) => <PosterCard key={`movie-${item.id}`} item={item} />}
    />
  )
}
