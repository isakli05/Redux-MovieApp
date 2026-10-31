/**
 * /keyword/:key_id/tv — Anahtar kelimeyle etiketlenmiş diziler.
 * Rota/parametre contract'ı korunur (slug'dan id + etiket çıkarımı);
 * liste, paylaşılan CatalogPage'in hibrit yükleme+biriktirme davranışına taşındı
 * (eski sayfa yalnızca 1. sayfayı gösteriyordu, defect Q).
 */

import { useLocation, useParams } from 'react-router-dom';
import { useGetTVShowsByKeywordQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';
import { extractIdFromSlug } from '@utils/slug.utils';

/** Slug'dan kalan kısımdan okunabilir etiket üretir. */
function labelFromSlug(pathname: string): string {
  const secondSegment = pathname.split('/')[2] ?? '';
  const parts = secondSegment.split('-').slice(1);
  return parts.filter((part) => part && part !== 'undefined').join(' ');
}

const capitalizeTr = (value: string): string =>
  value ? value.charAt(0).toLocaleUpperCase('tr-TR') + value.slice(1) : value;

function TvKeyList() {
  const { key_id: keySlug } = useParams();
  const location = useLocation();
  const keywordId = extractIdFromSlug(keySlug);
  const label = labelFromSlug(location.pathname);
  const pageTitle = label ? `${capitalizeTr(label)} Dizileri` : 'Anahtar Kelime Dizileri';

  useSEO({ title: pageTitle, description: 'Anahtar kelimeyle etiketlenmiş diziler — LMDB.' });

  // Sayfa bağımsız bağlı hook: CatalogPage page argümanını yönetir; keywordId
  // değişirse resetKey üzerinden birikim sıfırlanır.
  function useKeywordPage(page: number) {
    return useGetTVShowsByKeywordQuery(
      { keywordId: keywordId!, page },
      { skip: !keywordId },
    );
  }

  return (
    <CatalogPage
      eyebrow="Anahtar Kelime"
      title={pageTitle}
      description="Bu anahtar kelimeyle etiketlenmiş diziler"
      mediaType="tv"
      usePageQuery={useKeywordPage}
      resetKey={keywordId ?? ''}
      emptyTitle="Dizi bulunamadı"
      emptyHint="Bu anahtar kelimeyle etiketlenmiş dizi bulunamadı."
    />
  );
}

export default TvKeyList;
