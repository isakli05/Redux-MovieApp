import { useCallback, useRef } from 'react'
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

const chevronClasses =
  'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong text-secondary backdrop-blur-md transition-colors duration-150 ease-cine hover:border-accent hover:text-accent bg-surface-glass md:flex'

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

/**
 * Horizontal snap rail of cast cards for the "Kadro" tab (spec §6.7):
 * profile w185, name, character — each card links to /person/:id.
 * Kaydırma okları + görünür "Tümünü Gör" başlık bağlantısı tam kadro
 * sayfasına (/movie|tv/:id/cast) gider (sahibin geri-talebi).
 */
export function CastRail({ cast, detailPath, limit = 18, className = '' }: CastRailProps) {
  const listRef = useRef<HTMLUListElement>(null)

  const scrollRail = useCallback((direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  if (cast.length === 0) return null

  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-1 pt-4">
        <p className="text-sm text-secondary">
          <span className="tabular-nums">{cast.length}</span> kişi
        </p>
        <Link
          to={`${detailPath}/cast`}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
        >
          Tümünü Gör
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
        </Link>
      </div>

      <div className="relative">
        <ul
          ref={listRef}
          role="list"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide"
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

        <button type="button" aria-label="Önceki" onClick={() => scrollRail(-1)} className={chevronClasses + ' left-2'}>
          <ChevronIcon direction="left" />
        </button>
        <button type="button" aria-label="Sonraki" onClick={() => scrollRail(1)} className={chevronClasses + ' right-2'}>
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  )
}
