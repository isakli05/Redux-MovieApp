export interface RatingBadgeProps {
  /** TMDB 0–10 score. Renders nothing when null/undefined/0/invalid. */
  score?: number | null
  size?: 'sm' | 'md'
  className?: string
}

const dimensionBySize = { sm: 32, md: 40 } as const

/**
 * TMDB score ring: gold SVG stroke proportional to the score, tabular numeral.
 * Never call `.toFixed` without the numeric guard below (fixes the F-class
 * "vote_average.toFixed is not a function" crash family).
 */
export function RatingBadge({ score, size = 'sm', className = '' }: RatingBadgeProps) {
  if (typeof score !== 'number' || !Number.isFinite(score) || score <= 0) {
    return null
  }

  const clamped = Math.min(10, Math.max(0, score))
  const label = clamped.toFixed(1)
  const dimension = dimensionBySize[size]
  const stroke = size === 'sm' ? 2.5 : 3
  const radius = (dimension - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 10)

  return (
    <span
      role="img"
      aria-label={`TMDB puanı 10 üzerinden ${label}`}
      className={`relative inline-flex items-center justify-center rounded-full bg-surface-glass ${className}`}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="-rotate-90 text-accent"
        aria-hidden="true"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span
        className={`absolute font-semibold tabular-nums text-primary ${size === 'sm' ? 'text-[0.65rem]' : 'text-xs'}`}
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  )
}
