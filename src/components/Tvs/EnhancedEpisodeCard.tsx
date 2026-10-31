import { memo } from 'react'
import { Link } from 'react-router-dom'
import { StarIcon, ClockIcon, CalendarDaysIcon, UserGroupIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import type { Episode } from '../../types/tvSeasons'
import { getImageUrl, formatDate } from '../../utils'

interface EnhancedEpisodeCardProps {
  episode: Episode
}

/** Bölüm yayınlanmış mı? Tarihsiz bölümler "yayınlanmadı" sayılır (spoiler-safe). */
export const isEpisodeAired = (episode: Episode): boolean =>
  Boolean(episode.air_date) && new Date(episode.air_date).getTime() <= Date.now()

const EnhancedEpisodeCard = memo(function EnhancedEpisodeCard({ episode }: EnhancedEpisodeCardProps) {
  const director = episode.crew?.find((c) => c.job === 'Director')
  const writer = episode.crew?.find((c) => c.job === 'Writer' || c.job === 'Screenplay')

  // Spoiler koruması: yayınlanmamış bölümde still, puan ve özet gizlenir.
  const aired = isEpisodeAired(episode)
  const showRating = aired && episode.vote_average > 0
  const showOverview = aired && Boolean(episode.overview)

  return (
    <article className="group relative overflow-hidden rounded-lg border border-line bg-surface-base transition-colors duration-250 ease-cine hover:border-line-strong">
      <div className="flex flex-col gap-6 p-6 md:flex-row">
        {/* Bölüm görseli */}
        <div className="shrink-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-surface-overlay md:w-80">
            {aired && episode.still_path ? (
              <img
                src={getImageUrl(episode.still_path, 'w300')}
                alt={`${episode.episode_number}. bölüm görünütüsü`}
                className="h-full w-full object-cover transition-transform duration-400 ease-cine group-hover:scale-105 motion-reduce:transition-none"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-raised text-muted">
                <EyeSlashIcon className="h-8 w-8" aria-hidden="true" />
                <span className="px-4 text-center text-xs font-medium uppercase tracking-[0.08em]">
                  Henüz yayınlanmadı
                </span>
              </div>
            )}

            {/* Bölüm numarası */}
            <div className="absolute left-3 top-3 rounded-md border border-line-strong bg-surface-glass px-2.5 py-1 backdrop-blur-sm">
              <span className="text-lg font-bold tabular-nums text-primary">{episode.episode_number}</span>
            </div>

            {/* Puan — yalnızca yayınlanmış bölümlerde */}
            {showRating && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-glass px-2.5 py-1 backdrop-blur-sm">
                <StarIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-bold tabular-nums text-primary">
                  {episode.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bölüm bilgisi */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h3 className="font-display text-xl font-semibold tracking-tight text-primary transition-colors duration-150 ease-cine group-hover:text-accent md:text-2xl">
              {episode.episode_number}. {episode.name}
            </h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
              {episode.air_date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="tabular-nums">{formatDate(episode.air_date)}</span>
                </span>
              )}

              {episode.runtime ? (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="tabular-nums">{episode.runtime} dk</span>
                </span>
              ) : null}

              {aired && episode.vote_count ? (
                <span className="flex items-center gap-1.5">
                  <UserGroupIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="tabular-nums">{episode.vote_count.toLocaleString('tr-TR')} oy</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Özet — yayınlanmamışsa gizli */}
          {showOverview ? (
            <p className="line-clamp-3 leading-relaxed text-secondary">{episode.overview}</p>
          ) : (
            !aired && (
              <p className="text-sm italic leading-relaxed text-muted">
                Bu bölüm henüz yayınlanmadı; görsel, puan ve özet spoiler koruması altında.
              </p>
            )
          )}

          {/* Ekip */}
          {(director || writer) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {director && (
                <div>
                  <span className="text-muted">Yönetmen: </span>
                  <Link
                    to={`/person/${director.id}`}
                    className="font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
                  >
                    {director.name}
                  </Link>
                </div>
              )}

              {writer && (
                <div>
                  <span className="text-muted">Yazar: </span>
                  <Link
                    to={`/person/${writer.id}`}
                    className="font-medium text-secondary transition-colors duration-150 ease-cine hover:text-accent"
                  >
                    {writer.name}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Konuk oyuncular */}
          {episode.guest_stars && episode.guest_stars.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Konuk Oyuncular
              </h4>
              <div className="flex flex-wrap gap-2">
                {episode.guest_stars.slice(0, 6).map((star) => (
                  <Link
                    key={star.id}
                    to={`/person/${star.id}`}
                    className="rounded-full border border-transparent bg-surface-overlay px-3 py-1.5 text-sm text-secondary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent"
                  >
                    {star.name}
                  </Link>
                ))}
                {episode.guest_stars.length > 6 && (
                  <span className="rounded-full bg-surface-overlay px-3 py-1.5 text-sm tabular-nums text-muted">
                    +{episode.guest_stars.length - 6} daha
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
})

export default EnhancedEpisodeCard
