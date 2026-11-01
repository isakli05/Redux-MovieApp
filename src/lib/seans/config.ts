/**
 * LMDB Seans — sabitler ve "ruh hâli → dürüst vekil" haritası.
 *
 * TMDB'nin "mood" alanı yoktur. Her mood; tür ağırlıkları, puan eşiği ve
 * sıralama tercihinden oluşan GERÇEK discover parametrelerine çevrilir.
 * UI bu dürüstlüğü kullanıcıya da söyler (SHARED_CONTRACTS ruhuna uygun).
 */
import type {
  FamiliarityId,
  MoodId,
  RuntimeWindowId,
  SeansKind,
} from './types';

export interface MoodDef {
  id: MoodId;
  label: string;
  /** Kartın altındaki tek satırlık açıklama. */
  hint: string;
  /** Film için vekil tür id'leri — sıra = ağırlık (yüksek → düşük). */
  movieGenres: number[];
  /** Dizi için vekil tür id'leri. */
  tvGenres: number[];
  /** Kalite eşiği: junk sonuçları discover'da eler. */
  voteFloor: number;
}

export const MOODS: MoodDef[] = [
  {
    id: 'thrill',
    label: 'Yüksek gerilim',
    hint: 'Nefesini tutacağın bir şey',
    movieGenres: [28, 53, 12],
    tvGenres: [10759, 10765],
    voteFloor: 6.3,
  },
  {
    id: 'laugh',
    label: 'Kahkaha garantili',
    hint: 'Kafayı boşalt, gülmek istiyorsun',
    movieGenres: [35, 10751],
    tvGenres: [35, 10751],
    voteFloor: 6.0,
  },
  {
    id: 'feel',
    label: 'Kalbe dokunan',
    hint: 'Duygusal bir yolculuk',
    movieGenres: [18, 10749],
    tvGenres: [18],
    voteFloor: 6.8,
  },
  {
    id: 'mind',
    label: 'Zihin açan',
    hint: 'Bilmece, bilim kurgu, soyut düşün',
    movieGenres: [9648, 878, 14],
    tvGenres: [9648, 10765],
    voteFloor: 6.5,
  },
  {
    id: 'dark',
    label: 'Karanlık ve ürpertici',
    hint: 'Korku/gerilim; ışıkları açık tut',
    movieGenres: [27, 53],
    // TMDB'de dizi için ayrı "korku" türü yok — dürüst vekil: gizem + fantastik.
    tvGenres: [9648, 10765],
    voteFloor: 5.8,
  },
  {
    id: 'epic',
    label: 'Büyük gösteri',
    hint: 'Destansı ölçek, epik sahneler',
    movieGenres: [10752, 12, 14],
    tvGenres: [10768, 10759],
    voteFloor: 6.5,
  },
  {
    id: 'cozy',
    label: 'Huzurlu kaçamak',
    hint: 'Yormayan, sıcak, güvenli',
    movieGenres: [16, 10751, 35],
    tvGenres: [16, 10751],
    voteFloor: 6.8,
  },
  {
    id: 'real',
    label: 'Gerçek hikâyeler',
    hint: 'Belgesel, biyografi, tarih',
    movieGenres: [99, 36],
    tvGenres: [99, 80],
    voteFloor: 6.5,
  },
];

export function moodDef(id: MoodId | null | undefined): MoodDef | null {
  return MOODS.find((m) => m.id === id) ?? null;
}

/** Mood'un seçilen medya türü için vekil türleri. */
export function moodGenreIds(id: MoodId | null | undefined, kind: SeansKind): number[] {
  const def = moodDef(id);
  if (!def) return [];
  return kind === 'movie' ? def.movieGenres : def.tvGenres;
}

export interface RuntimeWindowDef {
  id: RuntimeWindowId;
  label: string;
  hint: string;
  /** Film dk cinsinden (toplam süre). */
  movie: { gte?: number; lte?: number } | null;
  /** Dizi dk cinsinden (bölüm süresi). */
  tv: { gte?: number; lte?: number } | null;
}

export const RUNTIME_WINDOWS: RuntimeWindowDef[] = [
  {
    id: 'short',
    label: 'Kısa',
    hint: 'Film ≤ 90 dk · bölüm ≤ 30 dk',
    movie: { lte: 90 },
    tv: { lte: 30 },
  },
  {
    id: 'medium',
    label: 'Orta',
    hint: 'Film 90–120 dk · bölüm 30–45 dk',
    movie: { gte: 90, lte: 120 },
    tv: { gte: 30, lte: 45 },
  },
  {
    id: 'long',
    label: 'Uzun',
    hint: 'Film 120+ dk · bölüm 45+ dk',
    movie: { gte: 120 },
    tv: { gte: 45 },
  },
  {
    id: 'any',
    label: 'Süre fark etmez',
    hint: 'Ne çıkarsa bahtına',
    movie: null,
    tv: null,
  },
];

export function runtimeDef(id: RuntimeWindowId | null | undefined): RuntimeWindowDef {
  return RUNTIME_WINDOWS.find((w) => w.id === id) ?? RUNTIME_WINDOWS[RUNTIME_WINDOWS.length - 1];
}

/**
 * Bir süreden (dk) pencere türet — seed başlangıç seviyesinde kullanılır.
 * Film toplam süre, dizi bölüm süresi ölçeğindedir; eşikler türe göre ayrışır.
 */
export function windowFromMinutes(
  minutes: number | null | undefined,
  kind: SeansKind,
): RuntimeWindowId {
  if (!minutes || minutes <= 0) return 'any';
  if (kind === 'tv') {
    if (minutes <= 30) return 'short';
    if (minutes <= 45) return 'medium';
    return 'long';
  }
  if (minutes <= 90) return 'short';
  if (minutes <= 120) return 'medium';
  return 'long';
}

export interface FamiliarityDef {
  id: FamiliarityId;
  label: string;
  hint: string;
  /** Discover kalite tabanı — az oy almış çöpü elemek için. */
  voteCountFloor: number;
  /** adventurous: puan sıralaması bilinen önemsizleri öne çıkarır. */
  sortBy: 'popularity.desc' | 'vote_average.desc';
}

export const FAMILIARITIES: FamiliarityDef[] = [
  {
    id: 'familiar',
    label: 'Bilinen sular',
    hint: 'Zevkime yakın, güvenli seçenekler',
    voteCountFloor: 150,
    sortBy: 'popularity.desc',
  },
  {
    id: 'adventurous',
    label: 'Yeni keşifler',
    hint: 'Alışmadığım türlerden sürpriz',
    voteCountFloor: 80,
    sortBy: 'vote_average.desc',
  },
];

export function familiarityDef(id: FamiliarityId | null | undefined): FamiliarityDef | null {
  return FAMILIARITIES.find((f) => f.id === id) ?? null;
}

/** Adım sırası ve kimlikleri — sayfa durum makinesi ile birebir. */
export const STEP_IDS = [
  'kind',
  'mood',
  'runtime',
  'genres',
  'familiarity',
  'providers',
] as const;

export type StepId = (typeof STEP_IDS)[number];

/** Dizi discover'ında film-akşamı listesini kirleten türler. */
export const TV_EXCLUDED_GENRES = [10763, 10767, 10764]; // haber, talk, reality

/** Bir discover çağrısında çekilen sayfa sayısı (aday havuzu ~2×20). */
export const DISCOVER_PAGES = 2;

/** Kullanıcıya gösterilen en fazla aday. */
export const MAX_DISPLAYED = 6;

/** Etkileşim günlüğünden zevk sinyali için detekilen en fazla hedef. */
export const TASTE_TARGET_CAP = 10;
