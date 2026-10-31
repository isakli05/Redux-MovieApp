/**
 * /tv — Popüler diziler katalog sayfası.
 * Eski slate/blue-purple sonsuz kaydırma sayfasının yerine paylaşılan
 * CatalogPage bileşeni (defect Q); veri kaynağı değişmedi.
 */

import { useGetPopularTVShowsQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function TVs() {
  useSEO({
    title: 'Diziler',
    description: 'En çok izlenen ve beğenilen popüler diziler — LMDB dizi kataloğu.',
  });

  return (
    <CatalogPage
      eyebrow="Katalog"
      title="Diziler"
      description="En çok izlenen ve beğenilen popüler diziler"
      mediaType="tv"
      usePageQuery={useGetPopularTVShowsQuery}
    />
  );
}

export default TVs;
