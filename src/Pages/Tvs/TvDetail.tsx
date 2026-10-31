import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useGetTvDetailFullQuery } from '@api/endpoints/tv.endpoints'
import { extractIdFromSlug } from '@utils/slug.utils'
import { useRegion } from '@hooks/useRegion'
import { useSEO } from '@hooks/useSEO'
import { recordVisit } from '@utils/recents'
import { ErrorState } from '@components/ui'
import {
  DetailDossier,
  DetailNotFound,
  DetailSkeleton,
  buildTvDossier,
  isNotFoundError,
} from '@components/detail'

/**
 * TV dossier page (DESIGN_DIRECTION.md §6): same shell as the movie page;
 * the dossier adds the seasons navigator strip and the creator crew group.
 * Error-first gating (defect P); TMDB 404s (status_code 34) render Tv404.
 */
function TvDetail() {
  const { id } = useParams<string>()
  const tvId = extractIdFromSlug(id)
  const { region } = useRegion()

  const { data, isLoading, error, refetch } = useGetTvDetailFullQuery(tvId ?? '', {
    skip: !tvId,
  })

  const dossier = data ? buildTvDossier(data, region) : null

  const year = data?.first_air_date?.slice(0, 4) || ''
  useSEO({
    title: data ? `${data.name}${year ? ` (${year})` : ''}` : undefined,
    description: data?.overview ? data.overview.slice(0, 160) : undefined,
    image: data?.backdrop_path ?? null,
  })

  useEffect(() => {
    if (data) {
      recordVisit({ id: data.id, media_type: 'tv', title: data.name, poster_path: data.poster_path ?? null })
    }
  }, [data])

  if (!tvId) {
    return <DetailNotFound mediaType="tv" />
  }

  if (error) {
    if (isNotFoundError(error)) {
      return <DetailNotFound mediaType="tv" />
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          title="Dizi yüklenemedi"
          message="Dizi detayı getirilirken bir hata oluştu. Lütfen tekrar deneyin."
          onRetry={() => refetch()}
          backTo="/tv"
          backLabel="Dizilere Dön"
        />
      </div>
    )
  }

  if (isLoading || !dossier) {
    return <DetailSkeleton />
  }

  return <DetailDossier data={dossier} />
}

export default TvDetail
