import { useId } from 'react'
import type { ReactNode } from 'react'
import { backdropSrcset, getBackdropUrl } from '@utils/image.utils'

export interface BackdropHeroProps {
  /** TMDB backdrop path. Missing/empty falls back to a textured surface-void panel. */
  backdropPath?: string | null
  /** Hero content (title block, buttons). Rendered above the scrims. */
  children?: ReactNode
  className?: string
}

/** Inline SVG radial texture — no external asset, no network request. */
function TextureFallback({ gradientId }: { gradientId: string }) {
  return (
    <div className="absolute inset-0 bg-surface-void" aria-hidden="true">
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="32%" r="85%">
            <stop offset="0%" stopColor="#1c1c28" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#16161f" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0a0a0f" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="1440" height="810" fill={`url(#${gradientId})`} />
        <g stroke="#f5f3ee" strokeOpacity="0.04" fill="none">
          <circle cx="720" cy="270" r="140" />
          <circle cx="720" cy="270" r="260" />
          <circle cx="720" cy="270" r="400" />
        </g>
      </svg>
    </div>
  )
}

/**
 * Full-bleed hero backdrop: eager w1280 img with srcset + fetchpriority=high,
 * bottom scrim (always) and left scrim (md+), content slot. min-h 62vh mobile /
 * 72vh desktop (spec §5). Only one hero per page — never stack two.
 */
export function BackdropHero({ backdropPath, children, className = '' }: BackdropHeroProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const hasImage = Boolean(backdropPath)

  return (
    <section
      className={`relative flex min-h-[62vh] items-end overflow-hidden bg-surface-void md:min-h-[72vh] ${className}`}
    >
      {hasImage ? (
        <img
          src={getBackdropUrl(backdropPath, 'LARGE')}
          srcSet={backdropSrcset(backdropPath)}
          sizes="100vw"
          alt=""
          loading="eager"
          decoding="async"
          {...{ fetchpriority: 'high' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <TextureFallback gradientId={`hero-texture-${gradientId}`} />
      )}

      <div aria-hidden="true" className="scrim-bottom absolute inset-0" />
      <div aria-hidden="true" className="scrim-left absolute inset-0 hidden md:block" />

      <div className="relative z-10 w-full">{children}</div>
    </section>
  )
}
