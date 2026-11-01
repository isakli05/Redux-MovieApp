/**
 * TMDB tür (genre) id → Türkçe ad haritası.
 * TMDB v3 genre id'leri kararlıdır; liste çağrısı yerine gömülü harita
 * kullanılır (ek istek yok, çevrimdışı test edilebilir).
 * shortcut: TMDB yeni tür eklerse harita güncellenmeli — nadirdir.
 */
export const MOVIE_GENRES: Record<number, string> = {
  28: 'Aksiyon',
  12: 'Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Dram',
  10751: 'Aile',
  14: 'Fantastik',
  36: 'Tarih',
  27: 'Korku',
  10402: 'Müzik',
  9648: 'Gizem',
  10749: 'Romantik',
  878: 'Bilim Kurgu',
  10770: 'TV Filmi',
  53: 'Gerilim',
  10752: 'Savaş',
  37: 'Western',
};

export const TV_GENRES: Record<number, string> = {
  10759: 'Aksiyon ve Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Dram',
  10751: 'Aile',
  10762: 'Çocuk',
  9648: 'Gizem',
  10763: 'Haber',
  10764: 'Reality Show',
  10765: 'Bilim Kurgu ve Fantastik',
  10766: 'Sabun Operası',
  10767: 'Talk Show',
  10768: 'Savaş ve Politika',
  37: 'Western',
};

/** `movie:35` / `tv:10759` anahtarından görünen ad; bilinmiyorsa anahtarın kendisi. */
export function genreLabel(genreKey: string): string {
  const sep = genreKey.indexOf(':');
  if (sep <= 0) return genreKey;
  const kind = genreKey.slice(0, sep);
  const id = Number(genreKey.slice(sep + 1));
  const map = kind === 'tv' ? TV_GENRES : MOVIE_GENRES;
  return map[id] ?? genreKey;
}
