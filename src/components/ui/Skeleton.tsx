export type SkeletonVariant = 'poster' | 'card' | 'line' | 'section'

export interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
}

const shapeByVariant: Record<SkeletonVariant, string> = {
  poster: 'aspect-[2/3] w-full rounded-lg',
  card: 'h-64 w-full rounded-lg',
  line: 'h-4 w-full rounded',
  section: 'h-7 w-48 rounded',
}

/**
 * Loading placeholder. `shimmer` gradient + `motion-safe:animate-shimmer`
 * (1.2s); under prefers-reduced-motion the global kill-switch freezes the
 * animation so the block renders as a static surface.
 */
export function Skeleton({ variant = 'line', className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`shimmer motion-safe:animate-shimmer ${shapeByVariant[variant]} ${className}`} />
}
