import { useParams } from 'react-router-dom'
import { useGetMovieDetailFullQuery } from '@api/endpoints/movies.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useSEO } from '@hooks/useSEO'
import { ErrorState, SectionHeader, Skeleton } from '@components/ui'
import { CastHeader, DetailNotFound, PersonCard, isNotFoundError } from '@components/detail'

/** Crew entries grouped by person — one card per person, jobs joined. */
function groupCrew(crew: { id: number; name: string; original_name: string; job: string; profile_path: string | null }[]) {
  const byPerson = new Map<
    number,
    { id: number; name: string; jobs: string[]; profilePath: string | null }
  >()
  for (const member of crew) {
    const existing = byPerson.get(member.id)
    if (existing) {
      if (!existing.jobs.includes(member.job)) existing.jobs.push(member.job)
    } else {
      byPerson.set(member.id, {
        id: member.id,
        name: member.original_name || member.name,
        jobs: member.job ? [member.job] : [],
        profilePath: member.profile_path ?? null,
      })
    }
  }
  return Array.from(byPerson.values())
}

/**
 * Full movie cast & crew (spec §6.12): grid of PersonCards with roles, back
 * header to the detail page. Uses the Full detail query so navigating from
 * the dossier reuses the RTK cache (no extra request).
 */
function MovieCast() {
  const { id } = useParams<string>()
  const movieId = extractIdFromSlug(id)

  const { data, isLoading, error, refetch } = useGetMovieDetailFullQuery(movieId ?? '', {
    skip: !movieId,
  })

  useSEO({
    title: data ? `Kadro — ${data.title}` : undefined,
    description: data?.overview ? data.overview.slice(0, 160) : undefined,
    image: data?.backdrop_path ?? null,
  })

  if (!movieId) {
    return <DetailNotFound mediaType="movie" />
  }

  if (error) {
    if (isNotFoundError(error)) {
      return <DetailNotFound mediaType="movie" />
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          title="Kadro yüklenemedi"
          message="Film kadrosu getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetch()}
          backTo={`/movie/${movieId}`}
          backLabel="Detaya Dön"
        />
      </div>
    )
  }

  const cast = data?.credits?.cast ?? []
  const crew = groupCrew(data?.credits?.crew ?? [])

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
      <CastHeader
        mediaType="movie"
        slug={movieId}
        title={data?.title ?? ''}
        posterPath={data?.poster_path ?? null}
        date={data?.release_date}
        subtitle="Filme dön"
        loading={isLoading}
      />

      <section aria-label="Oyuncular" className="mt-4">
        <SectionHeader
          title="Oyuncular"
          eyebrow="Kadro"
          as="h2"
          linkTo={`/movie/${movieId}`}
          linkLabel="Detaya Dön"
        />
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-24" />
            ))}
          </div>
        ) : cast.length > 0 ? (
          <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cast.map((member) => (
              <li key={`${member.id}-${member.credit_id}`}>
                <PersonCard
                  id={member.id}
                  name={member.original_name || member.name}
                  subtitle={member.character}
                  profilePath={member.profile_path ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary">Kayıtlı oyuncu bulunmuyor.</p>
        )}
      </section>

      {crew.length > 0 && (
        <section aria-label="Ekip" className="mt-12">
          <SectionHeader title="Ekip" eyebrow="Kadro" as="h2" />
          <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crew.map((member) => (
              <li key={member.id}>
                <PersonCard
                  id={member.id}
                  name={member.name}
                  subtitle={member.jobs.join(', ')}
                  profilePath={member.profilePath}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default MovieCast
