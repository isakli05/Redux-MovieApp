/**
 * Sayı ve string formatlama fonksiyonları
 */

/**
 * Para formatlar (USD)
 * @param amount - Miktar
 * @returns Formatlanmış para string (örn: "$1,234,567.00")
 */
export const formatCurrency = (
  amount: number | null | undefined
): string => {
  if (!amount || amount === 0) return 'Bilinmiyor';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Büyük sayıları kısaltır (K, M, B)
 * @param num - Sayı
 * @returns Kısaltılmış string (örn: "1.2M")
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (!num || num === 0) return '0';

  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(num) / 3);
  const unitName = units[order];
  const scaled = num / Math.pow(1000, order);

  return `${scaled.toFixed(1)}${unitName}`;
};

/**
 * Vote average'ı yüzdeye çevirir
 * @param vote - 0-10 arası vote değeri
 * @returns Yüzde değeri (0-100)
 */
export const voteToPercentage = (vote: number | null | undefined): number => {
  if (!vote) return 0;
  return Math.round(vote * 10);
};

/**
 * Metni belirli karakterde keser
 * @param text - Metin
 * @param maxLength - Maksimum karakter sayısı
 * @returns Kesilmiş metin
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 150
): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Array'i virgülle ayrılmış string'e çevirir
 * @param items - String array
 * @param separator - Ayırıcı (default: ", ")
 * @returns Birleştirilmiş string
 */
export const joinArray = (
  items: string[] | null | undefined,
  separator: string = ', '
): string => {
  if (!items || items.length === 0) return '';
  return items.join(separator);
};

