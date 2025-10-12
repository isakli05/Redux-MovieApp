/**
 * Tarih formatlama fonksiyonları
 */

/**
 * ISO tarih stringini Türkçe formata çevirir
 * @param date - ISO tarih string (örn: "2023-01-15")
 * @param options - Intl.DateTimeFormat seçenekleri
 * @returns Formatlanmış tarih string
 */
export const formatDate = (
  date: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  if (!date) return 'Bilinmiyor';

  try {
    return new Date(date).toLocaleDateString('tr-TR', options);
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return date;
  }
};

/**
 * Tarihten sadece yıl çıkarır
 * @param date - ISO tarih string
 * @returns Yıl (örn: 2023) veya boş string
 */
export const getYear = (date: string | null | undefined): string => {
  if (!date) return '';
  return date.slice(0, 4);
};

/**
 * Dakikayı saat ve dakika formatına çevirir
 * @param minutes - Dakika cinsinden süre
 * @returns Formatlanmış süre (örn: "2h 30m")
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || minutes === 0) return 'Bilinmiyor';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  const hoursPart = hours > 0 ? `${hours}s` : '';
  const minutesPart = remainingMinutes > 0 ? `${remainingMinutes}d` : '';

  return `${hoursPart} ${minutesPart}`.trim();
};

/**
 * İki tarih arası farkı hesaplar
 * @param startDate - Başlangıç tarihi
 * @param endDate - Bitiş tarihi
 * @returns Gün cinsinden fark
 */
export const getDaysBetween = (
  startDate: string,
  endDate: string = new Date().toISOString()
): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
};

