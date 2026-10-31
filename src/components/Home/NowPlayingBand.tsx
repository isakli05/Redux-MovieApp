import { Link } from 'react-router-dom'
import type { MediaSummary } from '@/types/mediaSummary'
import { useGetNowPlayingMoviesQuery } from '@api/endpoints/movies.endpoints'
import { ErrorState, PosterCard, SectionHeader, Skeleton } from '@components/ui'
import { backdropSrcset, getBackdropUrl, getPosterUrl } from '@utils/image.utils'
import { movieResultToSummary } from './mapToSummary'

const FEATURED_POSTER_COUNT = 8

const POSTER_SIZES = '(min-width: 1024px) 15vw, 45vw'
const FEATURED_SIZES = '(min-width: 1024px) 33vw, 100vw'

function yearOf(releaseDate?: string | null): string {
  if (!releaseDate || releaseDate.length < 4) return ''
  const year = releaseDate.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : ''
}

/** Editoryal geniş sahne kartı: 16:9 backdrop, scrim, başlık + yıl/puan satırı. */
function BackdropBandCard({ item }: { item: MediaSummary }) {
  const year = yearOf(item.release_date)
  const hasScore = typeof item.vote_average === 'number' && item.vote_average > 0

  return (
    <Link
      to={`/${item.media_type}/${item.id}`}
      className="group relative block aspect-video overflow-hidden rounded-xl border border-line bg-surface-raised transition-colors duration-250 ease-cine hover:border-accent"
    >
      {item.backdrop_path ? (
        <img
          src={getBackdropUrl(item.backdrop_path, 'LARGE')}
          srcSet={backdropSrcset(item.backdrop_path)}
          sizes={FEATURED_SIZES}
          alt={`${item.title} sahnesi`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-250 ease-cine group-hover:scale-102"
        />
      ) : item.poster_path ? (
        <img
          src={getPosterUrl(item.poster_path, 'LARGE')}
          alt={`${item.title} afişi`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-250 ease-cine group-hover:scale-102"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span aria-hidden="true" className="font-display text-5xl font-semibold text-secondary">
            {item.title.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
          </span>
        </div>
      )}

      <div aria-hidden="true" className="scrim-bottom absolute inset-0" />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-accent">
          Vizyonda
        </p>
        <h3 className="line-clamp-1 font-display text-lg font-semibold text-primary md:text-xl">
          {item.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs tabular-nums text-secondary">
          {year && <span>{year}</span>}
          {hasScore && <span>TMDB {item.vote_average?.toFixed(1)}</span>}
        </p>
      </div>
    </Link>
  )
}

/**
 * "Vizyonda" editoryal bant (spec §6): now_playing'in ilk yapımı büyük sahne
 * kartı, kalanı poster rayı — mobilde yatay kaydırma, lg'de 4 sütunlu ızgara.
 */
export function NowPlayingBand({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGetNowPlayingMoviesQuery(1)

  if (isError) {
    return (
      <section className={className}>
        <SectionHeader title="Vizyonda" eyebrow="Sinema" />
        <ErrorState message="Vizyondaki filmler yüklenirken bir sorun oluştu." onRetry={refetch} />
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className={className}>
        <SectionHeader title="Vizyonda" eyebrow="Sinema" linkTo="/movie/now-playing" />
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div aria-hidden="true" className="shimmer motion-safe:animate-shimmer aspect-video rounded-xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-2">
            {Array.from({ length: FEATURED_POSTER_COUNT }, (_, index) => (
              <div key={index} className="w-full">
                <Skeleton variant="poster" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const results = (data?.results ?? []).map(movieResultToSummary)
  if (results.length === 0) return null

  const [featured, ...rest] = results
  const posters = rest.slice(0, FEATURED_POSTER_COUNT)

  return (
    <section className={className}>
      <SectionHeader title="Vizyonda" eyebrow="Sinema" linkTo="/movie/now-playing" />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <BackdropBandCard item={featured} />

        <ul
          role="list"
          className={
            '-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 ' +
            'lg:col-span-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0'
          }
        >
          {posters.map((item) => (
            <li key={`movie-${item.id}`} className="shrink-0 snap-start lg:w-full">
              <PosterCard item={item} sizes={POSTER_SIZES} className="lg:w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
