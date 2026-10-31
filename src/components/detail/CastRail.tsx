import { Link } from 'react-router-dom'
import { getProfileUrl } from '@utils/image.utils'
import type { CastCardModel } from './detail.types'

export interface CastRailProps {
  cast: CastCardModel[]
  /** Base path for the full cast page: "/movie/603" or "/tv/1399". */
  detailPath: string
  /** Max cards before the "Tümünü gör" card. */
  limit?: number
  className?: string
}

/**
 * Horizontal snap rail of cast cards for the "Kadro" tab (spec §6.7):
 * profile w185, name, character — each card links to /person/:id.
 */
export function CastRail({ cast, detailPath, limit = 18, className = '' }: CastRailProps) {
  if (cast.length === 0) return null

  return (
    <div className={className}>
      <ul
        role="list"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {cast.slice(0, limit).map((member) => (
          <li key={member.id} className="w-32 shrink-0 snap-start sm:w-36">
            <Link to={`/person/${member.id}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-raised transition-[transform,border-color] duration-250 ease-cine group-hover:-translate-y-1 group-hover:border-accent">
                {member.profilePath ? (
                  <img
                    src={getProfileUrl(member.profilePath, 'SMALL')}
                    alt={`${member.name} profili`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center p-3 text-center font-display text-4xl font-semibold text-secondary">
                    {member.name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-primary transition-colors duration-150 ease-cine group-hover:text-accent" title={member.name}>
                {member.name}
              </p>
              {member.character && (
                <p className="truncate text-xs text-secondary" title={member.character}>
                  {member.character}
                </p>
              )}
            </Link>
          </li>
        ))}

        <li className="w-32 shrink-0 snap-start sm:w-36">
          <Link
            to={`${detailPath}/cast`}
            className="group flex aspect-[2/3] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent"
          >
            <span className="text-sm font-medium">Tümünü Gör</span>
            <svg
              className="h-4 w-4 transition-transform duration-150 ease-cine group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className="text-xs tabular-nums">{cast.length} kişi</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
