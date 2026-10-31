/**
 * Home bölümü raw liste tipleri → MediaSummary normalizasyonu.
 * API katmanı değiştirilmeden (read-only contract) mevcut `toMediaSummary`
 * haritası üzerinden çalışır (D5).
 */

import { toMediaSummary } from '@/types/mediaSummary';
import type { MediaSummary } from '@/types/mediaSummary';
import type { Result as MovieResult } from '@/types/Movies';
import type { Result as TvResult } from '@/types/tvs';

/** `/movie/*` liste sonucu → MediaSummary (movie discriminant). */
export const movieResultToSummary = (result: MovieResult): MediaSummary =>
  toMediaSummary({ ...result, media_type: 'movie' });

/** `/tv/*` liste sonucu → MediaSummary (tv discriminant). */
export const tvResultToSummary = (result: TvResult): MediaSummary =>
  toMediaSummary({ ...result, media_type: 'tv' });
