import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import type { TvDetails } from '../../types/tvsDetails'
import { getImageUrl, getBackdropUrl, posterSrcset, getYear } from '../../utils'

interface TvSeasonListBannerProps {
  /** Ham rota parametresi (slug) — dönüş linkinde kullanılır. */
  tv_id: string
  /** Sayfanın zaten abone olduğu dizi detayı; ekstra istek yok. */
  tvDetail?: TvDetails
}

/**
 * Seri bağlam başlığı (DESIGN_DIRECTION.md §6 Seasons): küçük arka plan şeridi,
 * poster, ad + yıl ve dizi detayına dönüş linki.
 */
function TvSeasonListBanner({ tv_id, tvDetail }: TvSeasonListBannerProps) {
  return (
    <div className="relative overflow-hidden border-b border-line bg-surface-void">
      {/* Arka plan şeridi */}
      {tvDetail?.backdrop_path && (
        <>
          <img
            src={getBackdropUrl(tvDetail.backdrop_path, 'LARGE')}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-surface-void via-surface-void/80 to-surface-void/40"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative container mx-auto px-4 py-8">
        <Link className="group flex w-fit items-center gap-4" to={`/tv/${tv_id}`}>
          <img
            loading="lazy"
            decoding="async"
            className="h-28 w-20 rounded-lg border border-transparent object-cover transition-colors duration-250 ease-cine group-hover:border-accent md:h-36 md:w-24"
            src={getImageUrl(tvDetail?.poster_path, 'w342')}
            srcSet={posterSrcset(tvDetail?.poster_path)}
            sizes="96px"
            alt={tvDetail?.name ?? 'Dizi posteri'}
          />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">Sezonlar</p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-primary transition-colors duration-150 ease-cine group-hover:text-accent md:text-4xl">
                {tvDetail?.name ?? 'Dizi'}
              </h1>
              {tvDetail?.first_air_date && (
                <span className="text-lg font-light tabular-nums text-muted md:text-2xl">
                  ({getYear(tvDetail.first_air_date)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-secondary transition-colors duration-150 ease-cine group-hover:text-accent">
              <ArrowLeftIcon
                className="h-4 w-4 transition-transform duration-250 ease-cine group-hover:-translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
              Dizi Detayına Dön
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default TvSeasonListBanner
