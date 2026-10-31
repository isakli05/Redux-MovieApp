/**
 * Keşfet filtre mantığı — saf, test edilebilir modül (URL = tek doğruluk kaynağı).
 *
 * URL şeması: `?tur=movie|tv&turler=28,12&yil=1990-2000&puan=7&dil=tr&sirala=rating&page=2`
 *
 * Wave 4 notları:
 * - `bolum` (watch provider) ve `bolge` (watch_region) parametreleri v1'de
 *   YOK: providers.endpoints.ts'te ana sağlayıcı listesi endpoint'i
 *   (`/watch/providers/movie|tv`) bulunmuyor (yalnızca regions + başlık başına
 *   providers var). Endpoint eklenince bu şemaya eklenmeli.
 * - Tür adları genres.ts'teki statik Türkçe tablodan gelir (API'de
 *   genre listesi endpoint'i yok).
 */

import { genreName } from './genres';

export type DiscoverType = 'movie' | 'tv';
export type DiscoverSortId = 'popularity' | 'rating' | 'votes' | 'date_desc' | 'date_asc';
export type DiscoverLanguage = '' | 'tr' | 'en';

export const DISCOVER_MIN_YEAR = 1900;
export const DISCOVER_MAX_YEAR = 2026;
export const DEFAULT_DISCOVER_SORT: DiscoverSortId = 'popularity';
/** Puan sıralaması güvenilir olması için otomatik eşlenen oy sayısı tabanı. */
export const RATING_SORT_VOTE_FLOOR = 300;
/** TMDB sayfa başına üst sınır. */
export const TMDB_MAX_PAGES = 500;

export interface DiscoverFilterState {
  type: DiscoverType;
  /** Seçili tür ID'leri (sıralı, tekrarsız). Çoklu seçim OR ile birleşir. */
  genres: number[];
  yearFrom: number | null;
  yearTo: number | null;
  /** 0 = filtre yok; aksi halde 5|6|7|8 → vote_average.gte. */
  minRating: 0 | 5 | 6 | 7 | 8;
  language: DiscoverLanguage;
  sort: DiscoverSortId;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilterState = {
  type: 'movie',
  genres: [],
  yearFrom: null,
  yearTo: null,
  minRating: 0,
  language: '',
  sort: DEFAULT_DISCOVER_SORT,
};

const SORT_IDS: DiscoverSortId[] = ['popularity', 'rating', 'votes', 'date_desc', 'date_asc'];

const parseYear = (value: string | null): number | null => {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= DISCOVER_MIN_YEAR && year <= DISCOVER_MAX_YEAR ? year : null;
};

/** `location.search` → filtre durumu. Geçersiz değerler sessizce düşer. */
export function parseDiscoverFilters(searchParams: URLSearchParams): DiscoverFilterState {
  const type: DiscoverType = searchParams.get('tur') === 'tv' ? 'tv' : 'movie';

  const genres = [
    ...new Set(
      (searchParams.get('turler') ?? '')
        .split(',')
        .map((raw) => Number(raw.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  const yilRaw = searchParams.get('yil') ?? '';
  const [rawFrom, rawTo] = yilRaw.split('-');
  let yearFrom = parseYear(rawFrom ?? null);
  let yearTo = parseYear(rawTo ?? null);
  // Ters aralık düzeltilir; tire içermeyen tek değer o yıla denk gelir.
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  } else if (yearFrom !== null && yearTo === null && !yilRaw.includes('-')) {
    yearTo = yearFrom;
  }

  const ratingRaw = Number(searchParams.get('puan'));
  const minRating = ([5, 6, 7, 8] as const).includes(ratingRaw as 5 | 6 | 7 | 8)
    ? (ratingRaw as 5 | 6 | 7 | 8)
    : 0;

  const langRaw = searchParams.get('dil');
  const language: DiscoverLanguage = langRaw === 'tr' || langRaw === 'en' ? langRaw : '';

  const sortRaw = searchParams.get('sirala') as DiscoverSortId | null;
  const sort = SORT_IDS.includes(sortRaw as DiscoverSortId)
    ? (sortRaw as DiscoverSortId)
    : DEFAULT_DISCOVER_SORT;

  return { type, genres, yearFrom, yearTo, minRating, language, sort };
}

/** Filtre durumu → `page` Hariç URL parametreleri (kısa, paylaşılabilir). */
export function serializeDiscoverFilters(state: DiscoverFilterState): Record<string, string> {
  const params: Record<string, string> = { tur: state.type };
  if (state.genres.length > 0) params.turler = state.genres.join(',');
  if (state.yearFrom !== null || state.yearTo !== null) {
    params.yil = `${state.yearFrom ?? ''}-${state.yearTo ?? ''}`;
  }
  if (state.minRating > 0) params.puan = String(state.minRating);
  if (state.language) params.dil = state.language;
  if (state.sort !== DEFAULT_DISCOVER_SORT) params.sirala = state.sort;
  return params;
}

/**
 * Filtre durumu → discover passthrough endpoint'ine verilecek sorgu parçası
 * (`useDiscoverMoviesQuery({ watchType })` / `useDiscoverTVShowsQuery`).
 *
 * Otomatik eşleme: `vote_average` sıralaması tek başına 1-2 oy almış öğeleri
 * öne çıkarır; bu yüzden `sort=rating` seçildiğinde `vote_count.gte=300`
 * (RATING_SORT_VOTE_FLOOR) otomatik eklenir (spec: "paired, document in code").
 */
export function filtersToQuery(state: DiscoverFilterState): string {
  const parts: string[] = [];

  if (state.genres.length > 0) {
    // Çoklu tür seçimi OR: kullanıcı "aksiyon VEYA bilim kurgu" bekler.
    parts.push(`with_genres=${state.genres.join('|')}`);
  }

  const dateField = state.type === 'movie' ? 'primary_release_date' : 'first_air_date';
  if (state.yearFrom !== null) parts.push(`${dateField}.gte=${state.yearFrom}-01-01`);
  if (state.yearTo !== null) parts.push(`${dateField}.lte=${state.yearTo}-12-31`);

  if (state.minRating > 0) parts.push(`vote_average.gte=${state.minRating}`);
  if (state.language) parts.push(`with_original_language=${state.language}`);

  switch (state.sort) {
    case 'popularity':
      parts.push('sort_by=popularity.desc');
      break;
    case 'rating':
      // Puan sıralaması ↔ oy sayısı tabanı eşlemesi (bkz. docblock).
      parts.push(`vote_count.gte=${RATING_SORT_VOTE_FLOOR}`, 'sort_by=vote_average.desc');
      break;
    case 'votes':
      parts.push('sort_by=vote_count.desc');
      break;
    case 'date_desc':
      parts.push(`sort_by=${dateField}.desc`);
      break;
    case 'date_asc':
      parts.push(`sort_by=${dateField}.asc`);
      break;
  }

  return parts.join('&');
}

// ---------------------------------------------------------------------------
// Özet cümle + aktif filtre çipleri
// ---------------------------------------------------------------------------

const typeNounAcc = (type: DiscoverType): string => (type === 'movie' ? 'filmleri' : 'dizileri');
const typeNoun = (type: DiscoverType): string => (type === 'movie' ? 'filmler' : 'diziler');

/**
 * Türkçe özet cümle parçaları: "Aksiyon, Bilim Kurgu filmleri · 2020–2026 ·
 * 7+ puan · Türkçe". Boş filtreler atlanır; hiçbiri yoksa sadece tür adı
 * kalır ("Filmler" / "Diziler").
 */
export function filterSummaryParts(state: DiscoverFilterState): string[] {
  const parts: string[] = [];

  const names = state.genres
    .map((id) => genreName(state.type, id))
    .filter((name): name is string => Boolean(name));
  const shown = names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
  parts.push(shown ? `${shown} ${typeNounAcc(state.type)}` : typeNoun(state.type));

  if (state.yearFrom !== null && state.yearTo !== null) {
    parts.push(`${state.yearFrom}–${state.yearTo}`);
  } else if (state.yearFrom !== null) {
    parts.push(`${state.yearFrom}+`);
  } else if (state.yearTo !== null) {
    parts.push(`${state.yearTo}'e kadar`);
  }

  if (state.minRating > 0) parts.push(`${state.minRating}+ puan`);
  if (state.language === 'tr') parts.push('Türkçe');
  if (state.language === 'en') parts.push('İngilizce');

  return parts;
}

export interface ActiveFilterChip {
  /** Çip kimliği: `genre-28`, `year`, `rating`, `language`. */
  id: string;
  label: string;
  /** Bu çipi kaldırınca uygulanacak kısmi değişiklik. */
  patch: Partial<DiscoverFilterState>;
}

/** Aktif filtrelerin çipleri (tür çipleri tek tek kaldırılabilir). */
export function activeFilterChips(state: DiscoverFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = state.genres.flatMap((id) => {
    const name = genreName(state.type, id);
    return name ? [{ id: `genre-${id}`, label: name, patch: { genres: state.genres.filter((g) => g !== id) } }] : [];
  });

  if (state.yearFrom !== null || state.yearTo !== null) {
    const label =
      state.yearFrom !== null && state.yearTo !== null
        ? `${state.yearFrom}–${state.yearTo}`
        : state.yearFrom !== null
          ? `${state.yearFrom}+`
          : `${state.yearTo}'e kadar`;
    chips.push({ id: 'year', label, patch: { yearFrom: null, yearTo: null } });
  }
  if (state.minRating > 0) {
    chips.push({ id: 'rating', label: `${state.minRating}+ puan`, patch: { minRating: 0 } });
  }
  if (state.language) {
    chips.push({
      id: 'language',
      label: state.language === 'tr' ? 'Türkçe' : 'İngilizce',
      patch: { language: '' },
    });
  }
  return chips;
}
