import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FilmIcon, CalendarIcon, PlayIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import type { ReactNode } from 'react'
import type { Season } from '../../types/tvsDetails'
import type { SeasonVideo } from '../../types/seasonVideos'
import { getImageUrl, posterSrcset, formatDate } from '../../utils'
import { RatingBadge, Button } from '../ui'

interface SeasonCardProps {
  season: Season
  tvId: string
  tvName: string
  videos?: SeasonVideo[]
  isLoading?: boolean
  onTrailerClick?: (video: SeasonVideo) => void
  /** Defect V: ağır medya (fragman/kadro) yalnızca kart açıldığında istenir. */
  isExpanded?: boolean
  onToggleExpand?: () => void
  /** Açılan bölgeye yüklenen içerik (kadro önizleme + fragman aksiyonları). */
  expandedContent?: ReactNode
  expandLabel?: string
}

const SeasonCard = memo(function SeasonCard({
  season,
  tvId,
  tvName,
  videos,
  isLoading,
  onTrailerClick,
  isExpanded = false,
  onToggleExpand,
  expandedContent,
  expandLabel = 'Fragman ve Kadro',
}: SeasonCardProps) {
  // En iyi fragman: gerçek Trailer, yoksa ilk video
  const trailer = videos?.find((v) => v.type === 'Trailer') || videos?.[0]

  const airTime = season.air_date ? new Date(season.air_date).getTime() : null
  const isCompleted = airTime !== null && airTime < Date.now()
  const statusLabel = airTime === null ? 'Tarih Belirsiz' : isCompleted ? 'Tamamlandı' : 'Yakında'
  const statusClass =
    statusLabel === 'Tamamlandı'
      ? 'border-line-strong text-success-text'
      : statusLabel === 'Yakında'
        ? 'border-accent text-accent'
        : 'border-line text-secondary'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface-base p-6 md:flex-row">
        <div className="shimmer motion-safe:animate-shimmer aspect-[2/3] w-32 shrink-0 rounded-lg md:w-40" />
        <div className="flex-1 space-y-4 py-2">
          <div className="shimmer motion-safe:animate-shimmer h-6 w-3/4 rounded" />
          <div className="shimmer motion-safe:animate-shimmer h-4 w-1/2 rounded" />
          <div className="shimmer motion-safe:animate-shimmer h-16 w-full rounded" />
        </div>
      </div>
    )
  }

  return (
    <article
      aria-labelledby={`season-${season.season_number}-title`}
      className="relative rounded-lg border border-line bg-surface-base transition-[transform,border-color] duration-250 ease-cine hover:-translate-y-1 hover:border-line-strong motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-6 p-6 md:flex-row">
        {/* Sezon Posteri */}
        <Link
          to={`/tv/${tvId}/season/${season.season_number}`}
          className="group relative mx-auto shrink-0 self-start md:mx-0"
          aria-label={`${season.name} detayları`}
        >
          <img
            loading="lazy"
            decoding="async"
            className="aspect-[2/3] w-32 rounded-lg border border-transparent object-cover transition-colors duration-250 ease-cine group-hover:border-accent md:w-40"
            src={getImageUrl(season.poster_path, 'w342')}
            srcSet={posterSrcset(season.poster_path)}
            sizes="(min-width: 768px) 160px, 128px"
            alt={season.name}
          />
          <span
            className={`absolute right-2 top-2 rounded-full border bg-surface-glass px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${statusClass}`}
          >
            {statusLabel}
          </span>
        </Link>

        {/* Sezon Bilgisi */}
        <div className="relative flex-1 space-y-4">
          <div className="space-y-2">
            <Link to={`/tv/${tvId}/season/${season.season_number}`} className="block">
              <h2
                id={`season-${season.season_number}-title`}
                className="font-display text-xl font-semibold tracking-tight text-primary transition-colors duration-150 ease-cine hover:text-accent md:text-2xl"
              >
                {season.name}
              </h2>
            </Link>

            {/* Meta Satırı */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {season.vote_average != null && season.vote_average > 0 && (
                <span className="flex items-center gap-1.5">
                  <RatingBadge score={season.vote_average} />
                  {season.vote_count ? (
                    <span className="tabular-nums text-muted">
                      {season.vote_count.toLocaleString('tr-TR')} oy
                    </span>
                  ) : null}
                </span>
              )}

              {season.air_date && (
                <span className="flex items-center gap-1.5 text-secondary">
                  <CalendarIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="tabular-nums">{season.air_date.slice(0, 4)}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5 text-secondary">
                <FilmIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                <span className="tabular-nums">{season.episode_count} Bölüm</span>
              </span>
            </div>
          </div>

          {/* Özet */}
          <p className="line-clamp-3 leading-relaxed text-secondary">
            {season.overview ||
              `${tvName} ${season.season_number}. Sezon ${
                season.air_date ? formatDate(season.air_date, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
              } tarihinde gösterime girdi.`
            }
          </p>

          {/* Aksiyonlar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button to={`/tv/${tvId}/season/${season.season_number}`} variant="outline" size="sm">
              Detayları Gör
            </Button>

            {onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Kapat' : expandLabel}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-250 ease-cine ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </Button>
            )}

            {isExpanded && trailer && onTrailerClick && (
              <Button variant="primary" size="sm" onClick={() => onTrailerClick(trailer)}>
                <PlayIcon className="h-4 w-4" aria-hidden="true" />
                Fragman İzle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tembel medya bölgesi (defect V): içerik ebeveyn tarafından yüklenir */}
      {isExpanded && expandedContent && (
        <div className="border-t border-line px-6 py-5">{expandedContent}</div>
      )}
    </article>
  )
})

export default SeasonCard
