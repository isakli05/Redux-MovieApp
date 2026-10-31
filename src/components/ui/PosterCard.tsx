import { Link } from 'react-router-dom'
import type { MediaSummary } from '@/types/mediaSummary'
import { getPosterUrl, posterSrcset } from '@utils/image.utils'
import { RatingBadge } from './RatingBadge'
import { Skeleton } from './Skeleton'

export type PosterCardSize = 'sm' | 'md' | 'lg'

export interface PosterCardProps {
  item: MediaSummary
  size?: PosterCardSize
  /** Show the TMDB rating ring (default true; hidden when score missing). */
  showRating?: boolean
  /** Show the media type label ("Film"/"Dizi"/"Kişi") in the hover meta overlay. */
  showMediaType?: boolean
  /** 'eager' for above-the-fold heroes — sets fetchpriority=high. Default 'lazy'. */
  loading?: 'eager' | 'lazy'
  /** Responsive sizes hint forwarded to the poster img. */
  sizes?: string
  className?: string
}

const widthBySize: Record<PosterCardSize, string> = {
  sm: 'w-32 sm:w-36',
  md: 'w-40 sm:w-44',
  lg: 'w-48 sm:w-56',
}

const urlSizeBySize: Record<PosterCardSize, 'SMALL' | 'MEDIUM' | 'LARGE'> = {
  sm: 'MEDIUM',
  md: 'MEDIUM',
  lg: 'LARGE',
}

const defaultSizes: Record<PosterCardSize, string> = {
  sm: '(max-width: 640px) 40vw, 144px',
  md: '(max-width: 640px) 45vw, 176px',
  lg: '(max-width: 640px) 55vw, 224px',
}

const mediaTypeLabel: Record<MediaSummary['media_type'], string> = {
  movie: 'Film',
  tv: 'Dizi',
  person: 'Kişi',
}

function detailPath(item: MediaSummary): string {
  return `/${item.media_type}/${item.id}`
}

function yearOf(releaseDate?: string | null): string {
  if (!releaseDate || releaseDate.length < 4) return ''
  const year = releaseDate.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : ''
}

function initialOf(title: string): string {
  const trimmed = title.trim()
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase('tr-TR') : '?'
}

/**
 * Poster tile for a MediaSummary item. Links to /movie|tv|person/:id.
 * Hover lift (scale 1.03, -4px, gold border) only applies on hover-capable
 * devices via the `hoverOnlyWhenSupported` Tailwind future flag.
 */
export function PosterCard({
  item,
  size = 'md',
  showRating = true,
  showMediaType = false,
  loading = 'lazy',
  sizes,
  className = '',
}: PosterCardProps) {
  const year = yearOf(item.release_date)
  const eager = loading === 'eager'
  const altKind = item.media_type === 'person' ? 'profili' : 'afişi'

  return (
    <Link
      to={detailPath(item)}
      className={`group/card block ${widthBySize[size]} ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-raised transition-[transform,border-color] duration-250 ease-cine hover:border-accent hover:-translate-y-1 hover:scale-[1.03]">
        {item.poster_path ? (
          <img
            src={getPosterUrl(item.poster_path, urlSizeBySize[size])}
            srcSet={posterSrcset(item.poster_path)}
            sizes={sizes ?? defaultSizes[size]}
            alt={`${item.title} ${altKind}`}
            loading={loading}
            decoding="async"
            {...(eager ? { fetchPriority: 'high' as const } : {})}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
            <span aria-hidden="true" className="font-display text-5xl font-semibold text-secondary">
              {initialOf(item.title)}
            </span>
            <span className="line-clamp-3 text-xs leading-relaxed text-muted">{item.title}</span>
          </div>
        )}

        {showRating && <RatingBadge score={item.vote_average} className="absolute right-2 top-2" />}

        {showMediaType && (
          <div className="scrim-bottom absolute inset-x-0 bottom-0 translate-y-2 p-2 pt-8 opacity-0 transition-[transform,opacity] duration-250 ease-cine group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-secondary">
              {mediaTypeLabel[item.media_type]}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium text-primary" title={item.title}>
          {item.title}
        </p>
        {year && <p className="mt-0.5 text-xs tabular-nums text-muted">{year}</p>}
      </div>
    </Link>
  )
}

/** Skeleton with the identical card shape (spec §5 PosterCard). */
export function PosterCardSkeleton({
  size = 'md',
  className = '',
}: {
  size?: PosterCardSize
  className?: string
}) {
  return (
    <div className={`${widthBySize[size]} ${className}`} aria-hidden="true">
      <Skeleton variant="poster" />
      <Skeleton variant="line" className="mt-2 w-3/4" />
      <Skeleton variant="line" className="mt-1.5 w-1/3" />
    </div>
  )
}
