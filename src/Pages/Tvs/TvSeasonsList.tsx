import { useState, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowUpIcon } from '@heroicons/react/24/solid'
import {
  useGetTVShowDetailsQuery,
  useGetSeasonVideosQuery,
  useGetSeasonAggregateCreditsQuery,
} from '@api/endpoints/tv.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useSEO } from '@hooks/useSEO'
import { ErrorState, EmptyState, Button } from '@components/ui'
import { DetailNotFound, isNotFoundError } from '@components/detail'
import TvSeasonListBanner from '@components/Tvs/TvSeasonListBanner'
import StatsOverview from '@components/Tvs/StatsOverview'
import SeasonsFilterBar, {
  type SeasonFilters,
  type SeasonSortConfig,
} from '@components/Tvs/SeasonsFilterBar'
import SeasonCard from '@components/Tvs/SeasonCard'
import SeasonCastPreview from '@components/Tvs/SeasonCastPreview'
import SeasonTrailerModal from '@components/Tvs/SeasonTrailerModal'
import { filterAndSortSeasons } from '@utils/seasonFilters'
import type { Season } from '@/types/tvsDetails'
import type { SeasonVideo } from '@/types/seasonVideos'

/** Kart iskeletleri — sayfa yüklenirken birebir aynı düzen (fix P: spinner değil). */
function SeasonsListSkeleton() {
  return (
    <div className="min-h-screen bg-surface-void">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="shimmer motion-safe:animate-shimmer h-36 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer motion-safe:animate-shimmer h-20 w-full rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-6 rounded-lg border border-line bg-surface-base p-6 md:flex-row">
            <div className="shimmer motion-safe:animate-shimmer aspect-[2/3] w-32 shrink-0 rounded-lg md:w-40" />
            <div className="flex-1 space-y-4 py-2">
              <div className="shimmer motion-safe:animate-shimmer h-6 w-3/4 rounded" />
              <div className="shimmer motion-safe:animate-shimmer h-4 w-1/2 rounded" />
              <div className="shimmer motion-safe:animate-shimmer h-16 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Defect V: ağır sezon medyası (videolar + aggregate credits) yalnızca kart
 * açıldığında istenir. Kapalı kart = 0 istek; açılış = en fazla 2 istek
 * (RTK Query önbelleği sonraki açılışları bedava yapar).
 */
function LazySeasonCard({
  season,
  tvId,
  tvName,
  isExpanded,
  onToggleExpand,
  onTrailerClick,
}: {
  season: Season
  tvId: string
  tvName: string
  isExpanded: boolean
  onToggleExpand: () => void
  onTrailerClick: (video: SeasonVideo, allVideos: SeasonVideo[]) => void
}) {
  const { data: videosData, isLoading: videosLoading } = useGetSeasonVideosQuery(
    { tvId, seasonNumber: season.season_number },
    { skip: !isExpanded },
  )

  const { data: creditsData, isLoading: creditsLoading } = useGetSeasonAggregateCreditsQuery(
    { tvId, seasonNumber: season.season_number },
    { skip: !isExpanded },
  )

  const mediaLoading = isExpanded && (videosLoading || creditsLoading)
  const videos = videosData?.results
  const cast = creditsData?.cast
  const hasVideos = Boolean(videos?.length)

  let expandedContent: ReactNode = null
  if (isExpanded) {
    if (mediaLoading) {
      expandedContent = (
        <div className="flex items-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shimmer motion-safe:animate-shimmer h-10 w-10 rounded-full"
              aria-hidden="true"
            />
          ))}
          <div className="shimmer motion-safe:animate-shimmer h-4 w-40 rounded" aria-hidden="true" />
        </div>
      )
    } else if (cast && cast.length > 0) {
      expandedContent = <SeasonCastPreview cast={cast} maxVisible={8} />
    } else if (!hasVideos) {
      expandedContent = (
        <p className="text-sm text-muted">Bu sezon için oyuncu veya fragman bilgisi bulunamadı.</p>
      )
    }
  }

  return (
    <SeasonCard
      season={season}
      tvId={tvId}
      tvName={tvName}
      videos={isExpanded ? videos : undefined}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      expandedContent={expandedContent}
      onTrailerClick={videos ? (video) => onTrailerClick(video, videos) : undefined}
    />
  )
}

function TvSeasonsList() {
  const { tv_id } = useParams<string>()
  const tvId = extractIdFromSlug(tv_id)

  const { data: tvDetail, isLoading, error, refetch } = useGetTVShowDetailsQuery(tvId ?? '', {
    skip: !tvId,
  })

  const [sortConfig, setSortConfig] = useState<SeasonSortConfig>({
    sortBy: 'season_number',
    sortOrder: 'asc',
  })

  const [filters, setFilters] = useState<SeasonFilters>({
    minRating: 0,
    status: 'all',
  })

  const [selectedVideo, setSelectedVideo] = useState<{ video: SeasonVideo; allVideos: SeasonVideo[] } | null>(
    null,
  )
  const [showScrollTop, setShowScrollTop] = useState(false)
  /** Açık sezon kartları (defect V): yalnızca bunlar medya isteği yapar. */
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set())

  const hasActiveFilters = filters.minRating > 0 || filters.status !== 'all'

  useSEO({
    title: tvDetail ? `${tvDetail.name} Sezonlar` : undefined,
    description: tvDetail?.overview
      ? `${tvDetail.name} tüm sezonlar, bölüm sayıları ve puanları. ${tvDetail.overview.slice(0, 120)}`
      : undefined,
    image: tvDetail?.backdrop_path ?? null,
  })

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (sortBy: SeasonSortConfig['sortBy'], sortOrder: SeasonSortConfig['sortOrder']) => {
    setSortConfig({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: SeasonFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      minRating: 0,
      status: 'all',
    })
  }

  const toggleSeasonExpand = (seasonNumber: number) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev)
      if (next.has(seasonNumber)) {
        next.delete(seasonNumber)
      } else {
        next.add(seasonNumber)
      }
      return next
    })
  }

  const processedSeasons = useMemo(() => {
    if (!tvDetail?.seasons) return []
    return filterAndSortSeasons(tvDetail.seasons, filters, sortConfig)
  }, [tvDetail?.seasons, filters, sortConfig])

  // Hata öncelikli akış (defect P): error → loading → data. Eski kod loading'i
  // kontrol ettiği için hatalı istekte sonsuz spinner dönüyordu.
  if (error) {
    if (isNotFoundError(error)) {
      return <DetailNotFound mediaType="tv" />
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-void px-4">
        <ErrorState
          title="Sezonlar yüklenemedi"
          message="Sezon bilgileri getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetch()}
          backTo="/tv"
          backLabel="Dizilere Dön"
        />
      </div>
    )
  }

  if (isLoading) {
    return <SeasonsListSkeleton />
  }

  if (!tvId || !tvDetail) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-void px-4">
        <ErrorState
          title="Dizi bulunamadı"
          message="Sezonları görmek için geçerli bir dizi gerekli."
          backTo="/tv"
          backLabel="Dizilere Dön"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-void">
      {/* Seri bağlam başlığı */}
      <TvSeasonListBanner tv_id={tv_id!} tvDetail={tvDetail} />

      {/* İstatistikler */}
      <div className="container mx-auto px-4 py-8">
        <StatsOverview seasons={tvDetail.seasons} />
      </div>

      {/* Filtre çubuğu */}
      <SeasonsFilterBar
        sortConfig={sortConfig}
        filters={filters}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Sezon ızgarası */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {processedSeasons.length > 0 ? (
            processedSeasons.map((season) => (
              <LazySeasonCard
                key={season.id}
                season={season}
                tvId={tvId}
                tvName={tvDetail.name}
                isExpanded={expandedSeasons.has(season.season_number)}
                onToggleExpand={() => toggleSeasonExpand(season.season_number)}
                onTrailerClick={(video, allVideos) => setSelectedVideo({ video, allVideos })}
              />
            ))
          ) : (
            <EmptyState
              title={hasActiveFilters ? 'Filtrelere uygun sezon bulunamadı' : 'Sezon bilgisi bulunamadı'}
              hint={
                hasActiveFilters
                  ? 'Filtreleri gevşetmeyi veya temizlemeyi deneyin.'
                  : 'Bu dizi için henüz sezon bilgisi mevcut değil.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Filtreleri Temizle
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Fragman modalı */}
      {selectedVideo && (
        <SeasonTrailerModal
          video={selectedVideo.video}
          allVideos={selectedVideo.allVideos}
          onVideoChange={(video) => setSelectedVideo({ ...selectedVideo, video })}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Başa dön */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 rounded-full border border-line-strong bg-surface-raised p-3 text-secondary shadow-cine transition-all duration-250 ease-cine hover:border-accent hover:text-accent"
          aria-label="Başa dön"
        >
          <ArrowUpIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default TvSeasonsList
