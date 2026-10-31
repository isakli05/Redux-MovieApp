/**
 * useRegion — bölge (watch region) ayarı, Redux DIŞI küçük bir modül (D5, fixes I).
 *
 * - Varsayılan: navigator.language territory (ör. 'tr-TR' → 'TR'), bulunamazsa 'TR'.
 * - Kalıcılık: localStorage `lmdb_region`.
 * - Doğrulama: `/watch/providers/regions` (cache'lenmiş getWatchRegions query);
 *   geçerli değilse fallback 'TR''e döner.
 *
 * Tüm yeni provider/free/discover çağrıları region'ı bu hook'tan alıp EXPLICIT
 * olarak geçirir (TMDB'nin varsayılan watch_region'u yoktur).
 */

import { useCallback, useEffect, useState } from 'react';
import { useGetWatchRegionsQuery } from '../api/endpoints/providers.endpoints';
import type { RegionOption } from '../api/endpoints/providers.endpoints';

export const REGION_STORAGE_KEY = 'lmdb_region';
export const FALLBACK_REGION = 'TR';

export interface UseRegionResult {
  /** Aktif ISO 3166-1 watch region (ör. 'TR'). */
  region: string;
  /** Region'ı günceller ve localStorage'a yazar. */
  setRegion: (region: string) => void;
  /** `/watch/providers/regions` seçenekleri (query cache'inden; yüklenene kadar undefined). */
  regions: RegionOption[] | undefined;
}

/**
 * Dil etiketinden territory çıkarır: 'tr-TR' → 'TR', 'en_US' → 'US'.
 * Territory yoksa/geçersizse fallback 'TR' döner. Pure — test edilebilir.
 */
export const deriveRegionFromNavigator = (language: string | undefined | null): string => {
  if (!language) return FALLBACK_REGION;
  const parts = language.split(/[-_]/);
  if (parts.length < 2) return FALLBACK_REGION;
  const territory = parts[parts.length - 1];
  if (!/^[a-zA-Z]{2}$/.test(territory)) return FALLBACK_REGION;
  return territory.toUpperCase();
};

const readStoredRegion = (): string | null => {
  try {
    return localStorage.getItem(REGION_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredRegion = (region: string): void => {
  try {
    localStorage.setItem(REGION_STORAGE_KEY, region);
  } catch {
    // localStorage kullanılamıyorsa (private mode vb.) sessizce geç.
  }
};

export const useRegion = (): UseRegionResult => {
  const [region, setRegionState] = useState<string>(() => {
    const stored = readStoredRegion();
    return stored ?? deriveRegionFromNavigator(navigator.language);
  });

  // Bölge listesi cache'lenmiş tek query'den gelir; hook kullanımı opsiyoneldir
  // (skip yok — RTK Query aynı cache'i paylaşır, maliyeti tek istektir).
  const { data: regions } = useGetWatchRegionsQuery();

  // Doğrulama: API listesinde olmayan bir region (ör. eski/yanlış kod) fallback'e düşer.
  useEffect(() => {
    if (!regions || regions.length === 0) return;
    if (!regions.some((option) => option.iso_3166_1 === region)) {
      setRegionState(FALLBACK_REGION);
      writeStoredRegion(FALLBACK_REGION);
    }
  }, [regions, region]);

  const setRegion = useCallback((next: string) => {
    const normalized = next.trim().toUpperCase();
    setRegionState(normalized);
    writeStoredRegion(normalized);
  }, []);

  return { region, setRegion, regions };
};
