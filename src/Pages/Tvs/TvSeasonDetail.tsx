import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  useGetTVSeasonDetailsQuery,
  useGetTVShowDetailsQuery,
  useGetSeasonVideosQuery,
} from '@api/endpoints/tv.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useSEO } from '@hooks/useSEO'
import { ErrorState, EmptyState } from '@components/ui'
import { DetailNotFound, isNotFoundError } from '@components/detail'
import EnhancedSeasonHeader from '@components/Tvs/EnhancedSeasonHeader'
import EpisodeStatistics from '@components/Tvs/EpisodeStatistics'
import EpisodeFilterBar, { type EpisodeSortOption, type SortOrder } from '@components/Tvs/EpisodeFilterBar'
import EnhancedEpisodeCard from '@components/Tvs/EnhancedEpisodeCard'
import SeasonTrailerModal from '@components/Tvs/SeasonTrailerModal'
import MediaGallery from '@components/MediaGallery/MediaGallery'
import { sortEpisodes } from '@utils/episodeSort'
import type { SeasonVideo } from '@/types/seasonVideos'

/** Sayfa iskeleti — spinner yerine düzeni koruyan shimmer blokları (fix P). */
function SeasonDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface-void">
      <div className="container mx-auto space-y-6 px-4 py-10">
        <div className="shimmer motion-safe:animate-shimmer h-5 w-44 rounded" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="shimmer motion-safe:animate-shimmer aspect-[2/3] w-48 shrink-0 rounded-xl md:w-64 lg:w-72" />
          <div className="flex-1 space-y-4">
            <div className="shimmer motion-safe:animate-shimmer h-4 w-24 rounded" />
            <div className="shimmer motion-safe:animate-shimmer h-12 w-2/3 rounded" />
            <div className="shimmer motion-safe:animate-shimmer h-4 w-1/2 rounded" />
            <div className="shimmer motion-safe:animate-shimmer h-20 w-full max-w-3xl rounded" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-6 rounded-lg border border-line bg-surface-base p-6 md:flex-row">
            <div className="shimmer motion-safe:animate-shimmer aspect-video w-full shrink-0 rounded-lg md:w-80" />
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

function TvSeasonDetail() {
  const { tv_id, season_number } = useParams<{ tv_id: string; season_number: string }>()
  const tvId = extractIdFromSlug(tv_id)
  const seasonNum = Number(season_number)
  const hasSeasonNumber = Number.isFinite(seasonNum) && seasonNum >= 0

  const {
    data: seasonDetail,
    isLoading: isSeasonLoading,
    error: seasonError,
    refetch: refetchSeason,
  } = useGetTVSeasonDetailsQuery(
    { tvId: tvId ?? '', seasonNumber: seasonNum },
    { skip: !tvId || !hasSeasonNumber },
  )

  // Başlık/gezinme bağlamı için dizi detayı
  const { data: tvDetail, error: tvError } = useGetTVShowDetailsQuery(tvId ?? '', {
    skip: !tvId,
  })

  const [sortBy, setSortBy] = useState<EpisodeSortOption>('episode_number')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  /** Tembel fragman (defect V): istek yalnızca kullanıcı tıklayınca atılır.
   * MediaGallery aynı RTK cache anahtarını kullandığı için veri genelde bedavadır. */
  const [trailerRequested, setTrailerRequested] = useState(false)
  const [trailerVideo, setTrailerVideo] = useState<SeasonVideo | null>(null)

  const { data: seasonVideos, isLoading: videosLoading } = useGetSeasonVideosQuery(
    { tvId: tvId ?? '', seasonNumber: seasonNum },
    { skip: !trailerRequested || !tvId || !hasSeasonNumber },
  )

  const videos = seasonVideos?.results ?? []
  const trailer = videos.find((v) => v.type === 'Trailer') || videos[0]
  const trailerUnavailable = trailerRequested && !videosLoading && !trailer

  useSEO({
    title: tvDetail ? `${tvDetail.name} ${seasonNum}. Sezon` : undefined,
    description: seasonDetail?.overview
      ? seasonDetail.overview.slice(0, 160)
      : tvDetail
        ? `${tvDetail.name} ${seasonNum}. sezon bölümleri, puanları ve kadrosu.`
        : undefined,
    image: tvDetail?.backdrop_path ?? null,
  })

  const handleSortChange = (newSortBy: EpisodeSortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const handleTrailerClick = () => {
    if (trailer) {
      setTrailerVideo(trailer)
    } else {
      setTrailerRequested(true)
    }
  }

  // İstek tamamlandığında fragmanı aç (veya yoksa düğme gizlenir)
  useEffect(() => {
    if (trailerRequested && !videosLoading && trailer) {
      setTrailerVideo(trailer)
    }
  }, [trailerRequested, videosLoading, trailer])

  const sortedEpisodes = useMemo(() => {
    if (!seasonDetail?.episodes) return []
    return sortEpisodes(seasonDetail.episodes, sortBy, sortOrder)
  }, [seasonDetail?.episodes, sortBy, sortOrder])

  // Hata öncelikli akış (defect P): eski kod loading'i önce kontrol ettiği
  // için hatalı istekte sonsuz spinner dönüyordu.
  const loadError = seasonError ?? tvError
  if (loadError) {
    if (isNotFoundError(loadError)) {
      return <DetailNotFound mediaType="tv" />
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-void px-4">
        <ErrorState
          title="Sezon yüklenemedi"
          message="Sezon bilgileri getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetchSeason()}
          backTo={tvId ? `/tv/${tvId}/seasons` : '/tv'}
          backLabel="Sezonlara Dön"
        />
      </div>
    )
  }

  if (isSeasonLoading || !seasonDetail || !tvDetail) {
    return <SeasonDetailSkeleton />
  }

  return (
    <div className="min-h-screen bg-surface-void">
      {/* Gelişmiş başlık: arka plan, poster, meta, sezon gezinme, tembel fragman */}
      <EnhancedSeasonHeader
        seasonDetail={seasonDetail}
        tvDetail={tvDetail}
        tvId={tvId ?? ''}
        seasonNumber={seasonNum}
        onTrailerClick={handleTrailerClick}
        trailerLoading={trailerRequested && videosLoading && !trailerVideo}
        trailerUnavailable={trailerUnavailable}
      />

      {/* Medya galerisi: fragmanlar ve görseller */}
      <div className="container mx-auto px-4 py-8">
        <MediaGallery
          mediaType="season"
          id={tvId ?? ''}
          seasonNumber={seasonNum}
          defaultTab="videos"
        />
      </div>

      {/* Sezon istatistikleri */}
      <div className="container mx-auto px-4 py-8">
        <EpisodeStatistics episodes={seasonDetail.episodes || []} />
      </div>

      {/* Bölüm sıralama çubuğu */}
      <EpisodeFilterBar
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        totalEpisodes={seasonDetail.episodes?.length || 0}
      />

      {/* Bölüm listesi */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {sortedEpisodes.length > 0 ? (
            sortedEpisodes.map((episode) => (
              <EnhancedEpisodeCard key={episode.id} episode={episode} />
            ))
          ) : (
            <EmptyState
              title="Bölüm bulunamadı"
              hint="Bu sezon için henüz bölüm bilgisi mevcut değil."
            />
          )}
        </div>
      </div>

      {/* Fragman modalı */}
      {trailerVideo && (
        <SeasonTrailerModal
          video={trailerVideo}
          allVideos={videos.length > 0 ? videos : undefined}
          onVideoChange={setTrailerVideo}
          onClose={() => setTrailerVideo(null)}
        />
      )}
    </div>
  )
}

export default TvSeasonDetail
