/**
 * @deprecated Bu dosya artık kullanılmıyor.
 * Lütfen @utils paketini kullanın:
 * - import { getPosterUrl, formatDate, formatDuration } from '@utils';
 * 
 * Bu dosya geriye dönük uyumluluk için tutulmaktadır.
 */

import { TMDB_CONFIG } from '@utils/constants';
import { formatDate as utilFormatDate, formatDuration as utilFormatDuration } from '@utils';

export const image = TMDB_CONFIG.IMAGE_BASE_URL;

export const air_date = (date: string) => utilFormatDate(date);

export const timeConvert = (n: number) => utilFormatDuration(n);
