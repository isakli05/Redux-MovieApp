import { RatingBadge } from '@components/ui'

export interface MetaChipsProps {
  /** Pre-formatted chips (year, runtime/seasons, certification). */
  items: string[]
  /** Genre pills — static tags (links/discover wiring land with the Discover page). */
  genres?: { id: number; name: string }[]
  /** TMDB score; the badge hides itself for 0/undefined (never unguarded .toFixed). */
  score?: number
  className?: string
}

/**
 * Dossier meta row: text chips + genre pills + score ring (spec §6.2).
 * Genre tags are non-interactive spans styled like the kit Chip — spec §7
 * bans decorative non-functional controls, so no dead buttons.
 */
export function MetaChips({ items, genres = [], score, className = '' }: MetaChipsProps) {
  if (items.length === 0 && genres.length === 0 && !score) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-2 tabular-nums text-body-sm text-secondary ${className}`}
    >
      <RatingBadge score={score} size="md" />

      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-glass px-3 py-1.5 text-sm font-medium text-primary"
        >
          {item}
        </span>
      ))}

      {genres.map((genre) => (
        <span
          key={genre.id}
          className="inline-flex items-center rounded-full border border-line bg-surface-overlay px-3 py-1.5 text-sm font-medium text-secondary"
        >
          {genre.name}
        </span>
      ))}
    </div>
  )
}
