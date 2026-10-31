import { Link } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon, CalendarDaysIcon, FilmIcon } from '@heroicons/react/24/solid'
import type { TvSeasons } from '../../types/tvSeasons'
import type { TvDetails } from '../../types/tvsDetails'
import { getImageUrl, posterSrcset, backdropSrcset, getBackdropUrl, formatDate } from '../../utils'
import { RatingBadge, Button } from '../ui'

interface EnhancedSeasonHeaderProps {
  seasonDetail: TvSeasons
  tvDetail: TvDetails
  tvId: string
  seasonNumber: number
  /** Fragman düğmesi: tıklama ebeveynde tembel video isteğini tetikler. */
  onTrailerClick?: () => void
  /** Fragman verisi yüklenirken düğme spinner'ı. */
  trailerLoading?: boolean
  /** İstek tamamlandı ve fragman yoksa düğme gizlenir/devre dışı kalır. */
  trailerUnavailable?: boolean
}

function EnhancedSeasonHeader({
  seasonDetail,
  tvDetail,
  tvId,
  seasonNumber,
  onTrailerClick,
  trailerLoading = false,
  trailerUnavailable = false,
}: EnhancedSeasonHeaderProps) {
  const canGoPrevious = seasonNumber > 1
  const canGoNext = seasonNumber < tvDetail.number_of_seasons

  // Yalnızca yayınlanmış bölümlerin puanları ortalama alınır (spoiler-safe)
  const airedEpisodes = (seasonDetail.episodes ?? []).filter(
    (ep) => ep.air_date && new Date(ep.air_date).getTime() <= Date.now(),
  )
  const ratingPool = airedEpisodes.filter((ep) => ep.vote_average > 0)
  const avgRating =
    ratingPool.length > 0
      ? ratingPool.reduce((sum, ep) => sum + (ep.vote_average || 0), 0) / ratingPool.length
      : 0

  const showTrailer = Boolean(onTrailerClick) && !trailerUnavailable

  return (
    <header className="relative overflow-hidden border-b border-line bg-surface-void">
      {/* Dizi arka planı — boyutlu + srcset (w780/w1280/original) */}
      {tvDetail.backdrop_path && (
        <>
          <img
            src={getBackdropUrl(tvDetail.backdrop_path, 'LARGE')}
            srcSet={backdropSrcset(tvDetail.backdrop_path)}
            sizes="100vw"
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-surface-void via-surface-void/80 to-surface-void/40"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        {/* Sezon listesine dön */}
        <Link
          to={`/tv/${tvId}/seasons`}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
        >
          <ArrowLeftIcon
            className="h-4 w-4 transition-transform duration-250 ease-cine group-hover:-translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          />
          Sezon Listesine Dön
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sezon posteri */}
          <div className="mx-auto shrink-0 self-start lg:mx-0">
            <img
              src={getImageUrl(seasonDetail.poster_path || tvDetail.poster_path, 'w500')}
              srcSet={posterSrcset(seasonDetail.poster_path || tvDetail.poster_path)}
              sizes="(min-width: 1024px) 288px, 192px"
              alt={seasonDetail.name}
              className="w-48 rounded-xl border border-line object-cover md:w-64 lg:w-72"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Sezon bilgisi */}
          <div className="flex-1 space-y-6">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">
                {tvDetail.name}
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl lg:text-5xl">
                {seasonDetail.name}
              </h1>

              {/* Meta satırı */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-secondary">
                {avgRating > 0 && (
                  <span className="flex items-center gap-2">
                    <RatingBadge score={avgRating} size="md" />
                    <span>sezon ortalaması</span>
                  </span>
                )}

                {seasonDetail.air_date && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                    <span className="tabular-nums">
                      {formatDate(seasonDetail.air_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <FilmIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="tabular-nums">{seasonDetail.episodes?.length || 0} Bölüm</span>
                </span>
              </div>
            </div>

            {/* Özet */}
            {seasonDetail.overview && (
              <p className="max-w-3xl leading-relaxed text-secondary">{seasonDetail.overview}</p>
            )}

            {/* Aksiyonlar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {showTrailer && (
                <Button onClick={onTrailerClick} loading={trailerLoading}>
                  <PlayIcon className="h-4 w-4" aria-hidden="true" />
                  Fragman İzle
                </Button>
              )}

              {canGoPrevious && (
                <Button to={`/tv/${tvId}/season/${seasonNumber - 1}`} variant="outline">
                  <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                  {seasonNumber - 1}. Sezon
                </Button>
              )}

              {canGoNext && (
                <Button to={`/tv/${tvId}/season/${seasonNumber + 1}`} variant="outline">
                  {seasonNumber + 1}. Sezon
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default EnhancedSeasonHeader
