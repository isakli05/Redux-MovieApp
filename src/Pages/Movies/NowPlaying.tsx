/**
 * /movie/now-playing — Vizyondaki filmler.
 * Eski sayfa "Daha Fazla Yükle"de ızgarayı YENİ sayfayla değiştiriyordu
 * (mimari inceleme bulgusu); CatalogPage'in biriktirme davranışı bunu düzeltir.
 */

import { useGetNowPlayingMoviesQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function NowPlaying() {
  useSEO({
    title: 'Vizyondaki Filmler',
    description: 'Şu anda sinemalarda gösterimde olan filmler — LMDB.',
  });

  return (
    <CatalogPage
      eyebrow="Vizyonda"
      title="Vizyondaki Filmler"
      description="Şu anda sinemalarda gösterimde olan filmler"
      mediaType="movie"
      usePageQuery={useGetNowPlayingMoviesQuery}
    />
  );
}

export default NowPlaying;
