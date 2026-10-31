/**
 * /tv/on-the-air — Yayında olan diziler.
 * CatalogPage'e ince sarmalayıcı (defect Q); "Daha Fazla Yükle"de ızgaranın
 * yeni sayfayla DEĞİŞTİRİLmesi hatası biriktirmeli yüklemeyle düzeltildi.
 */

import { useGetOnTheAirTVShowsQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function OnAir() {
  useSEO({
    title: 'Yayındaki Diziler',
    description: 'Şu anda televizyonda yayında olan diziler — LMDB.',
  });

  return (
    <CatalogPage
      eyebrow="Yayında"
      title="Yayındaki Diziler"
      description="Şu anda televizyonda yayın devam eden diziler"
      mediaType="tv"
      usePageQuery={useGetOnTheAirTVShowsQuery}
    />
  );
}

export default OnAir;
