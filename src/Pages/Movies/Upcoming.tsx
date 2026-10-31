/**
 * /movie/upcoming — Yakında vizyona girecek filmler.
 * CatalogPage'e ince sarmalayıcı (defect Q); biriktirmeli hibrit yükleme,
 * eski sayfanın sayfa değişiminde ızgarayı sıfırlaması düzeltildi.
 */

import { useGetUpcomingMoviesQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function Upcoming() {
  useSEO({
    title: 'Yakında',
    description: 'Yakında vizyona girecek yeni filmler — LMDB.',
  });

  return (
    <CatalogPage
      eyebrow="Yakında"
      title="Yakındaki Filmler"
      description="Vizyona girecek yeni filmler"
      mediaType="movie"
      usePageQuery={useGetUpcomingMoviesQuery}
    />
  );
}

export default Upcoming;
