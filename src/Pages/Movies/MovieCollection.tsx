import { useParams } from 'react-router-dom'
import { useGetMovieCollectionQuery } from '@api/endpoints/movies.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useSEO } from '@hooks/useSEO'
import { BackdropHero, ErrorState, PosterCard } from '@components/ui'
import {
  DetailNotFound,
  DetailSkeleton,
  isNotFoundError,
  resultListToSummaries,
  slugToId,
} from '@components/detail'
import type { Result } from '@/types/Movies'

/**
 * Collection page (spec §6.11): BackdropHero from the collection backdrop,
 * Fraunces title + overview, then a PosterCard grid of the parts sorted by
 * release date. Existing sort logic kept; presentation moved to the kit.
 */
function MovieCollection() {
  const { coll_id } = useParams<string>()
  const collectionId = extractIdFromSlug(coll_id)

  const { data, isLoading, error, refetch } = useGetMovieCollectionQuery(collectionId ?? '', {
    skip: !collectionId,
  })

  useSEO({
    title: data ? `${data.name} Koleksiyonu` : undefined,
    description: data?.overview ? data.overview.slice(0, 160) : undefined,
    image: data?.backdrop_path ?? null,
  })

  if (!collectionId || slugToId(coll_id) === null) {
    return <DetailNotFound mediaType="movie" />
  }

  if (error) {
    if (isNotFoundError(error)) {
      return <DetailNotFound mediaType="movie" />
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          title="Koleksiyon yüklenemedi"
          message="Koleksiyon getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetch()}
          backTo="/movie"
          backLabel="Filmlere Dön"
        />
      </div>
    )
  }

  if (isLoading || !data) {
    return <DetailSkeleton />
  }

  const parts = [...data.parts]
    .sort((a, b) => {
      const dateA = new Date(a.release_date || '').getTime() || 0
      const dateB = new Date(b.release_date || '').getTime() || 0
      return dateA - dateB
    })
    .map(
      (part): Result =>
        ({
          ...part,
          media_type: 'movie',
        }) as Result
    )
  const summaries = resultListToSummaries(parts, 'movie')

  return (
    <article className="bg-surface-void">
      <BackdropHero backdropPath={data.backdrop_path}>
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">Koleksiyon</p>
          <h1 className="mt-2 max-w-3xl font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-primary">
            {data.name}
          </h1>
          {data.overview && (
            <p className="mt-4 max-w-2xl leading-relaxed text-secondary">{data.overview}</p>
          )}
          <p className="mt-3 text-sm tabular-nums text-muted">{data.parts.length} film</p>
        </div>
      </BackdropHero>

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-primary">
          Koleksiyondaki Filmler
        </h2>
        <ul
          role="list"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {summaries.map((item) => (
            <li key={item.id}>
              <PosterCard item={item} size="md" />
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default MovieCollection
