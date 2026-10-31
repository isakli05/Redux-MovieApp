import { Link } from 'react-router-dom'
import { getProfileUrl } from '@utils/image.utils'
import { Skeleton } from '@components/ui'

export interface PersonCardItem {
  id: number
  name: string
  profilePath: string | null
  /** known_for_department when the endpoint provides it, else a known-for work title. */
  subtitle: string
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase('tr-TR') : '?'
}

/** Browse-grid person card: profile (w185), name, department line. Links to /person/:id. */
export function PersonCard({ person }: { person: PersonCardItem }) {
  return (
    <Link to={`/person/${person.id}`} className="group/person block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-raised transition-[transform,border-color] duration-250 ease-cine hover:border-accent hover:-translate-y-1 hover:scale-[1.03]">
        {person.profilePath ? (
          <img
            src={getProfileUrl(person.profilePath, 'SMALL')}
            srcSet={`${getProfileUrl(person.profilePath, 'SMALL')} 185w, ${getProfileUrl(person.profilePath, 'MEDIUM')} 422w`}
            sizes="(max-width: 640px) 45vw, 200px"
            alt={`${person.name} profili`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
            <span aria-hidden="true" className="font-display text-5xl font-semibold text-secondary">
              {initialOf(person.name)}
            </span>
            <span className="line-clamp-3 text-xs leading-relaxed text-muted">{person.name}</span>
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium text-primary transition-colors duration-150 ease-cine group-hover/person:text-accent" title={person.name}>
          {person.name}
        </p>
        {person.subtitle && <p className="mt-0.5 truncate text-xs text-muted">{person.subtitle}</p>}
      </div>
    </Link>
  )
}

/** Identical-shape loading placeholder for the browse grid. */
export function PersonCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton variant="poster" />
      <Skeleton variant="line" className="mt-2 w-4/5" />
      <Skeleton variant="line" className="mt-1.5 w-1/2" />
    </div>
  )
}
