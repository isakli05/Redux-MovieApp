import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useGetMovieDetailFullQuery } from '@api/endpoints/movies.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useRegion } from '@hooks/useRegion'
import { useSEO } from '@hooks/useSEO'
import { recordVisit } from '@utils/recents'
import { ErrorState } from '@components/ui'
import {
  DetailDossier,
  DetailNotFound,
  DetailSkeleton,
  buildMovieDossier,
  isNotFoundError,
} from '@components/detail'

/**
 * Movie dossier page (DESIGN_DIRECTION.md §6): one Full query (10 appends),
 * normalized into DetailDossierData and rendered by the shared shell.
 * Error-first gating (defect P): fetch errors render ErrorState with retry,
 * TMDB 404s (status_code 34) render the styled Movie404 body.
 */
function MovieDetail() {
  const { id } = useParams<string>()
  const movieId = extractIdFromSlug(id)
  const { region } = useRegion()

  const { data, isLoading, error, refetch } = useGetMovieDetailFullQuery(movieId ?? '', {
    skip: !movieId,
  })

  const dossier = data ? buildMovieDossier(data, region) : null

  const year = data?.release_date?.slice(0, 4) || ''
  useSEO({
    title: data ? `${data.title}${year ? ` (${year})` : ''}` : undefined,
    description: data?.overview ? data.overview.slice(0, 160) : undefined,
    image: data?.backdrop_path ?? null,
  })

  useEffect(() => {
    if (data) {
      recordVisit({ id: data.id, media_type: 'movie', title: data.title, poster_path: data.poster_path ?? null })
    }
  }, [data])

  // Invalid slug (no leading id) is a 404, not a loading state.
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
          title="Film yüklenemedi"
          message="Film detayı getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetch()}
          backTo="/movie"
          backLabel="Filmlere Dön"
        />
      </div>
    )
  }

  if (isLoading || !dossier) {
    return <DetailSkeleton />
  }

  return <DetailDossier data={dossier} />
}

export default MovieDetail
