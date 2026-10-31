import { Link } from 'react-router-dom'
import { getProfileUrl } from '@utils/image.utils'

export interface PersonCardProps {
  id: number
  name: string
  /** Character(s) or crew job(s). */
  subtitle: string
  profilePath: string | null
  /** Optional trailing badge, e.g. "12 Bölüm". */
  badge?: string
}

/** Grid person tile for the full cast/crew pages. Links to /person/:id. */
export function PersonCard({ id, name, subtitle, profilePath, badge }: PersonCardProps) {
  return (
    <Link
      to={`/person/${id}`}
      className="group flex items-center gap-4 rounded-lg border border-line bg-surface-base p-3 transition-[border-color,transform] duration-250 ease-cine hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface-raised">
        {profilePath ? (
          <img
            src={getProfileUrl(profilePath, 'SMALL')}
            alt={`${name} profili`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-secondary">
            {name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary transition-colors duration-150 ease-cine group-hover:text-accent" title={name}>
          {name}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-secondary" title={subtitle}>
            {subtitle}
          </p>
        )}
        {badge && <p className="mt-0.5 text-xs tabular-nums text-muted">{badge}</p>}
      </div>
    </Link>
  )
}
