import { Link } from 'react-router-dom'
import type { CrewGroup } from './detail.types'

export interface CrewRowProps {
  groups: CrewGroup[]
  className?: string
}

/**
 * "Yönetmen / Yaratıcı · Senaryo · Müzik" strip under the overview
 * (spec §6.5). Each name links to /person/:id; empty groups are dropped
 * by the dossier builder so nothing renders for crew-less titles.
 */
export function CrewRow({ groups, className = '' }: CrewRowProps) {
  const visible = groups.filter((g) => g.people.length > 0)
  if (visible.length === 0) return null

  return (
    <dl className={`flex flex-wrap items-baseline gap-x-8 gap-y-3 ${className}`}>
      {visible.map((group) => (
        <div key={group.label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
            {group.label}
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {group.people.map((person, index) => (
              <span key={person.id} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="text-muted">,</span>}
                <Link
                  to={`/person/${person.id}`}
                  className="font-medium text-primary transition-colors duration-150 ease-cine hover:text-accent"
                >
                  {person.name}
                </Link>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
