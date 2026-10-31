import type { ReactNode } from 'react'
import { ErrorState, MediaRail, PosterCardSkeleton, SectionHeader } from '@components/ui'

export interface RailSectionProps<T> {
  title: string
  eyebrow?: string
  linkTo?: string
  linkLabel?: string
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  /** Ready-to-render list; undefined while loading. Empty list hides the rail. */
  items?: T[]
  renderItem: (item: T, index: number) => ReactNode
  skeletonCount?: number
  /** Optional note under the rail (JustWatch attribution, criteria, …). */
  footer?: ReactNode
  className?: string
}

const RAIL_ERROR_MESSAGE = 'Bu bölüm yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.'

/**
 * Home raylarının ortak durum makinesi (spec §6): iskelet → hata (ErrorState +
 * yeniden dene) → boşsa bölümü tamamen gizle → MediaRayı render et.
 */
export function RailSection<T>({
  title,
  eyebrow,
  linkTo,
  linkLabel,
  isLoading,
  isError,
  onRetry,
  items,
  renderItem,
  skeletonCount = 6,
  footer,
  className = '',
}: RailSectionProps<T>) {
  if (isError) {
    return (
      <section className={className}>
        <SectionHeader title={title} eyebrow={eyebrow} />
        <ErrorState message={RAIL_ERROR_MESSAGE} onRetry={onRetry} />
      </section>
    )
  }

  if (isLoading || !items) {
    return (
      <section className={className}>
        <MediaRail title={title} eyebrow={eyebrow}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <PosterCardSkeleton key={index} />
          ))}
        </MediaRail>
        {footer}
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className={className}>
      <MediaRail title={title} eyebrow={eyebrow} linkTo={linkTo} linkLabel={linkLabel}>
        {items.map((item, index) => renderItem(item, index))}
      </MediaRail>
      {footer}
    </section>
  )
}
