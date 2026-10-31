import { DetailNotFound } from '@components/detail'
import { useSEO } from '@hooks/useSEO'

/** Catch-all for unknown /tv/* routes and TMDB 404 detail responses. */
function Tv404() {
  useSEO({ title: 'Dizi bulunamadı' })
  return <DetailNotFound mediaType="tv" />
}

export default Tv404
