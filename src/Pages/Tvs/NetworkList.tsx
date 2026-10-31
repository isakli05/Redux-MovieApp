/**
 * /network/:net_id — Bir yayıncıya (ağa) ait diziler.
 * Rota/parametre contract'ı korunur; yayıncı adı/logosu mevcut raw fetch ile
 * alınmaya devam eder (API katmanı genişletilmedi). Liste, paylaşılan
 * CatalogPage'in hibrit yükleme+biriktirme davranışına taşındı (defect Q).
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTVShowsByNetworkQuery } from '@api/index';
import { CatalogPage } from '@components/catalog/CatalogPage';
import { useSEO } from '@hooks/useSEO';
import { TMDB_CONFIG } from '@utils/constants';
import type { Network } from '@/types/tvsDetails';

function NetworkList() {
  const { net_id: netId } = useParams();
  const [network, setNetwork] = useState<Network>();

  // Yayıncı detayı (ad/logo) — mevcut davranışın korunmuş hali.
  useEffect(() => {
    if (!netId) return;
    let cancelled = false;
    fetch(`${TMDB_CONFIG.BASE_URL}/network/${netId}?api_key=${TMDB_CONFIG.API_KEY}`)
      .then((res) => res.json())
      .then((data: Network) => {
        if (!cancelled) setNetwork(data);
      })
      .catch((err) => console.error('Network fetch error:', err));
    return () => {
      cancelled = true;
    };
  }, [netId]);

  const networkName = network?.name || 'Yayıncı Dizileri';
  useSEO({ title: networkName, description: `${networkName} yayıncısına ait diziler — LMDB.` });

  // Sayfa bağımsız bağlı hook: CatalogPage page argümanını yönetir; netId
  // değişirse resetKey üzerinden birikim sıfırlanır.
  function useNetworkPage(page: number) {
    return useGetTVShowsByNetworkQuery(
      { networkId: netId!, page },
      { skip: !netId },
    );
  }

  return (
    <CatalogPage
      eyebrow="Yayıncı"
      title={networkName}
      description="Bu yayıncıya ait diziler"
      mediaType="tv"
      usePageQuery={useNetworkPage}
      resetKey={netId ?? ''}
      emptyTitle="Dizi bulunamadı"
      emptyHint="Bu yayıncıya ait dizi bulunamadı."
      headerAside={
        network?.logo_path ? (
          <img
            loading="lazy"
            className="mt-3 h-9 w-auto rounded-md bg-white px-3 py-1 object-contain"
            src={`${TMDB_CONFIG.IMAGE_BASE_URL}${network.logo_path}`}
            alt={`${network.name} logosu`}
          />
        ) : undefined
      }
    />
  );
}

export default NetworkList;
