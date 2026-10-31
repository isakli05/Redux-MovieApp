import { DetailNotFound } from '@components/detail'
import { useSEO } from '@hooks/useSEO'

/** Catch-all for unknown /movie/* routes and TMDB 404 detail responses. */
function Movie404() {
  useSEO({ title: 'Film bulunamadı' })
  return <DetailNotFound mediaType="movie" />
}

export default Movie404
