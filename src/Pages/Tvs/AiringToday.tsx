/**
 * /tv/airing-today — Bugün yayınlanan diziler.
 * CatalogPage'e ince sarmalayıcı (defect Q); "Daha Fazla Yükle"de ızgaranın
 * yeni sayfayla DEĞİŞTİRİLmesi hatası biriktirmeli yüklemeyle düzeltildi.
 */

import { useGetAiringTodayTVShowsQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';

function AiringToday() {
  useSEO({
    title: 'Bugün Yayınlanan Diziler',
    description: 'Bugün televizyonda yayınlanan diziler — LMDB.',
  });

  return (
    <CatalogPage
      eyebrow="Yayın Akışı"
      title="Bugün Yayınlanan Diziler"
      description="Bugün televizyonda yayınlanan diziler"
      mediaType="tv"
      usePageQuery={useGetAiringTodayTVShowsQuery}
    />
  );
}

export default AiringToday;
