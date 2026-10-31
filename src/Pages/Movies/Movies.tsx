/**
 * /movie — Popüler filmler katalog sayfası.
 * Eski slate/cyan sonsuz kaydırma sayfasının yerine paylaşılan
 * CatalogPage bileşeni (defect Q); veri kaynağı değişmedi.
 */

import { useGetPopularMoviesQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function Movies() {
  useSEO({
    title: 'Filmler',
    description: 'En çok izlenen ve beğenilen popüler filmler — LMDB film kataloğu.',
  });

  return (
    <CatalogPage
      eyebrow="Katalog"
      title="Filmler"
      description="En çok izlenen ve beğenilen popüler filmler"
      mediaType="movie"
      usePageQuery={useGetPopularMoviesQuery}
    />
  );
}

export default Movies;
