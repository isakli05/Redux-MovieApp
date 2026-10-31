import { Link } from 'react-router-dom'
import { getPosterUrl } from '@utils/image.utils'
import { SectionHeader } from '@components/ui'
import type { SeasonCardModel } from './detail.types'

export interface SeasonsStripProps {
  /** Raw route id (slug or numeric) used to build /tv/:id/season links. */
  tvSlug: string
  seasons: SeasonCardModel[]
  className?: string
}

/**
 * TV seasons navigator strip (spec §6.8): simple poster grid — the rich
 * seasons PAGE (/tv/:id/seasons, per-season filters/stats) stays untouched
 * for the seasons workstream.
 */
export function SeasonsStrip({ tvSlug, seasons, className = '' }: SeasonsStripProps) {
  if (seasons.length === 0) return null

  return (
    <section className={className} aria-label="Sezonlar">
      <SectionHeader
        title="Sezonlar"
        eyebrow="Dizi"
        linkTo={`/tv/${tvSlug}/seasons`}
        linkLabel="Tüm Sezonlar"
      />

      <ul
        role="list"
        className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
      >
        {seasons.map((season) => {
          const year = season.airDate?.slice(0, 4) || ''
          const label = season.seasonNumber === 0 ? season.name : `${season.seasonNumber}. Sezon`
          return (
            <li key={season.seasonNumber}>
              <Link
                to={`/tv/${tvSlug}/season/${season.seasonNumber}`}
                className="group block"
                aria-label={`${label} — ${season.episodeCount} bölüm`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-raised transition-[transform,border-color] duration-250 ease-cine group-hover:-translate-y-1 group-hover:border-accent">
                  {season.posterPath ? (
                    <img
                      src={getPosterUrl(season.posterPath, 'MEDIUM')}
                      alt={`${label} posteri`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center">
                      <span className="font-display text-3xl font-semibold text-secondary">
                        {season.seasonNumber}
                      </span>
                      <span className="line-clamp-2 text-[0.65rem] leading-tight text-muted">
                        {season.name}
                      </span>
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-primary transition-colors duration-150 ease-cine group-hover:text-accent">
                  {label}
                </p>
                <p className="text-xs tabular-nums text-muted">
                  {[year, `${season.episodeCount} bölüm`].filter(Boolean).join(' · ')}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
