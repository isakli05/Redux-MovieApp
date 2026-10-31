import { Link } from 'react-router-dom'
import { getPosterUrl } from '@utils/image.utils'
import { getYear } from '@utils/date.utils'
import { Skeleton } from '@components/ui'

export interface CastHeaderProps {
  mediaType: 'movie' | 'tv'
  /** Raw route slug used for the back link. */
  slug: string
  title: string
  posterPath: string | null
  date: string | null | undefined
  subtitle: string
  loading?: boolean
  className?: string
}

/**
 * Compact "back to detail" banner for the full-cast pages: small poster,
 * Fraunces title + year, ghost back link. Replaces the per-media banner
 * components the old cast pages used.
 */
export function CastHeader({
  mediaType,
  slug,
  title,
  posterPath,
  date,
  subtitle,
  loading = false,
  className = '',
}: CastHeaderProps) {
  const year = getYear(date)

  if (loading) {
    return (
      <div className={`flex items-center gap-4 py-6 ${className}`} role="status" aria-live="polite">
        <Skeleton variant="poster" className="w-16" />
        <div className="space-y-2">
          <Skeleton variant="line" className="w-56" />
          <Skeleton variant="line" className="w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 py-6 ${className}`}>
      <Link
        to={`/${mediaType}/${slug}`}
        className="group flex min-w-0 items-center gap-4"
        aria-label={`${title} detayına dön`}
      >
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-surface-raised">
          {posterPath ? (
            <img
              src={getPosterUrl(posterPath, 'SMALL')}
              alt={`${title} afişi`}
              loading="eager"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-secondary">
              {title.charAt(0).toLocaleUpperCase('tr-TR')}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-primary transition-colors duration-150 ease-cine group-hover:text-accent md:text-2xl">
            {title}
            {year && <span className="ml-2 font-sans text-base font-normal text-muted">{year}</span>}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-secondary">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {subtitle}
          </p>
        </div>
      </Link>
    </div>
  )
}
