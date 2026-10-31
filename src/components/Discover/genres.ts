/**
 * Tür (genre) seçenekleri — Keşfet v1.
 *
 * NOT (Wave 4 API boşluğu): API katmanında `/genre/movie/list` ve
 * `/genre/tv/list` endpoint'leri YOK (src/api/endpoints/ içinde genre endpoint
 * bulunmuyor; yeni API dosyası açma yetkim yok). TMDB tür ID'leri kararlı
 * olduğu için v1'de bu statik tablo kullanılır ve isimler Türkçe verilir
 * ("genre names from API may be English v1" notunun yerine). Wave 4'te
 * endpoint eklenince bu tablo API'den gelen listeyle değiştirilmelidir.
 */

export interface GenreOption {
  id: number;
  /** Türkçe tür adı (statik v1 — bkz. dosya başlığı). */
  name: string;
}

export const MOVIE_GENRES: GenreOption[] = [
  { id: 28, name: 'Aksiyon' },
  { id: 12, name: 'Macera' },
  { id: 16, name: 'Animasyon' },
  { id: 35, name: 'Komedi' },
  { id: 80, name: 'Suç' },
  { id: 99, name: 'Belgesel' },
  { id: 18, name: 'Dram' },
  { id: 10751, name: 'Aile' },
  { id: 14, name: 'Fantastik' },
  { id: 36, name: 'Tarih' },
  { id: 27, name: 'Korku' },
  { id: 10402, name: 'Müzik' },
  { id: 9648, name: 'Gizem' },
  { id: 10749, name: 'Romantik' },
  { id: 878, name: 'Bilim Kurgu' },
  { id: 10770, name: 'TV Filmi' },
  { id: 53, name: 'Gerilim' },
  { id: 10752, name: 'Savaş' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES: GenreOption[] = [
  { id: 10759, name: 'Aksiyon ve Macera' },
  { id: 16, name: 'Animasyon' },
  { id: 35, name: 'Komedi' },
  { id: 80, name: 'Suç' },
  { id: 99, name: 'Belgesel' },
  { id: 18, name: 'Dram' },
  { id: 10751, name: 'Aile' },
  { id: 9648, name: 'Gizem' },
  { id: 10762, name: 'Çocuk' },
  { id: 10763, name: 'Haber' },
  { id: 10764, name: 'Reality Şov' },
  { id: 10765, name: 'Bilim Kurgu ve Fantastik' },
  { id: 10766, name: 'Pembe Dizi' },
  { id: 10767, name: 'Talk Show' },
  { id: 10768, name: 'Savaş ve Politika' },
  { id: 37, name: 'Western' },
];

export const genresFor = (type: 'movie' | 'tv'): GenreOption[] =>
  type === 'movie' ? MOVIE_GENRES : TV_GENRES;

export const genreName = (type: 'movie' | 'tv', id: number): string | undefined =>
  genresFor(type).find((genre) => genre.id === id)?.name;
