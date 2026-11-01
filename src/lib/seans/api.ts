/**
 * LMDB Seans — veri sınırı (data boundary).
 *
 * TMDB v3 discover/genre/provider/detail çağrıları, mevcut BFF yolundan:
 * dev'de Vite proxy `/api/tmdb`, prod'da `TMDB_CONFIG.BASE_URL` + api_key
 * (tmdb.api.ts'teki withAuthParams kuralının aynısı, SHARED_CONTRACTS §D).
 * Browser asla doğrudan api.themoviedb.org'a gitmez — BASE_URL ortaktır.
 *
 * Tüm URL kurucuları ve normalizasyonlar saf ve test edilebilir dışa aktarılır;
 * `fetch*` fonksiyonları ince sarmalayıcılardır (mock-fetch testleri için).
 */
import { TMDB_CONFIG } from '@utils/constants';
import { DISCOVER_PAGES, TV_EXCLUDED_GENRES, familiarityDef, moodDef, runtimeDef } from './config';
import type { SeansAnswers, SeansCandidate } from './types';
import type { MediaKind, MediaRef } from '../mediaRef';

const LANGUAGE = TMDB_CONFIG.LANGUAGE;

/** Seans veri katmanının hata şekli — TmdbQueryError ile aynı ruhta. */
export class SeansApiError extends Error {
  readonly status?: number | 'FETCH_ERROR';
  readonly statusCode?: number;
  constructor(message: string, status?: number | 'FETCH_ERROR', statusCode?: number) {
    super(message);
    this.name = 'SeansApiError';
    this.status = status;
    this.statusCode = statusCode;
  }
}

/** Prod'da api_key ekler (D1: sadece prod, query param olarak). */
export function withApiKey(url: string): string {
  if (import.meta.env.PROD && TMDB_CONFIG.API_KEY) {
    return `${url}${url.includes('?') ? '&' : '?'}api_key=${TMDB_CONFIG.API_KEY}`;
  }
  return url;
}

/** Tek TMDB çağrısı — hataları SeansApiError'a normaline eder. */
export async function tmdbFetch<T = unknown>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${TMDB_CONFIG.BASE_URL}${withApiKey(path)}`);
  } catch {
    throw new SeansApiError("Ağ hatası: TMDB'ye ulaşılamadı", 'FETCH_ERROR');
  }
  if (!res.ok) {
    let statusCode: number | undefined;
    let message = `TMDB ${res.status}`;
    try {
      const body = (await res.json()) as { status_code?: number; status_message?: string };
      statusCode = body?.status_code;
      message = body?.status_message ?? message;
    } catch {
      /* gövde JSON değilse HTTP durumu yeter */
    }
    throw new SeansApiError(message, res.status, statusCode);
  }
  return (await res.json()) as T;
}

// --- URL kurucular (saf — test edilebilir) ---------------------------------

export const genreListUrl = (kind: 'movie' | 'tv'): string =>
  `/genre/${kind}/list?language=${LANGUAGE}`;

export const providerCatalogUrl = (kind: 'movie' | 'tv', region: string): string =>
  `/watch/providers/${kind}?language=${LANGUAGE}&watch_region=${encodeURIComponent(region)}`;

export const detailUrl = (kind: MediaKind, id: number): string =>
  `/${kind}/${id}?language=${LANGUAGE}`;

/**
 * Cevaplardan discover sorgusu — mood vekilleri, süre penceresi, türler,
 * zevkilik kalite tabanı ve (varsa) bölge/servis filtresi tek URL'de buluşur.
 */
export function discoverUrl(answers: SeansAnswers, page: number): string {
  const { kind, mood, runtime, genres, familiarity, providers, region } = answers;
  const params = new URLSearchParams({
    language: LANGUAGE,
    include_adult: 'false',
    page: String(page),
  });

  const moodD = moodDef(mood);
  if (moodD) params.set('vote_average.gte', String(moodD.voteFloor));

  const famD = familiarityDef(familiarity);
  params.set('sort_by', famD?.sortBy ?? 'popularity.desc');
  params.set('vote_count.gte', String(famD?.voteCountFloor ?? 100));

  if (genres.length > 0) params.set('with_genres', genres.join('|'));

  if (kind === 'tv' && TV_EXCLUDED_GENRES.length > 0) {
    params.set('without_genres', TV_EXCLUDED_GENRES.join(','));
  }

  const rt = runtimeDef(runtime);
  const bounds = kind === 'movie' ? rt.movie : rt.tv;
  if (bounds) {
    if (bounds.gte !== undefined) params.set('with_runtime.gte', String(bounds.gte));
    if (bounds.lte !== undefined) params.set('with_runtime.lte', String(bounds.lte));
  }

  if (providers.length > 0 && region) {
    params.set('watch_region', region);
    params.set('with_watch_providers', providers.join('|'));
  }

  return `/discover/${kind}?${params.toString()}`;
}

// --- Normalizasyon (saf) -----------------------------------------------------

/** TMDB discover satırı — alanlar eksik/geçersiz olabilir, asla patratmaz. */
export interface RawDiscoverItem {
  id?: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  popularity?: number;
}

export function normalizeCandidate(raw: RawDiscoverItem, kind: 'movie' | 'tv'): SeansCandidate | null {
  if (typeof raw.id !== 'number' || raw.id <= 0) return null;
  const title = (raw.title ?? raw.name ?? '').trim();
  if (!title) return null;
  return {
    ref: { kind, id: raw.id, title, posterPath: raw.poster_path ?? null },
    title,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    voteAverage: typeof raw.vote_average === 'number' ? raw.vote_average : 0,
    voteCount: typeof raw.vote_count === 'number' ? raw.vote_count : 0,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids.filter((g) => typeof g === 'number') : [],
    popularity: typeof raw.popularity === 'number' ? raw.popularity : 0,
  };
}

export function normalizeDiscoverPage(raw: unknown, kind: 'movie' | 'tv'): SeansCandidate[] {
  const results = (raw as { results?: RawDiscoverItem[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: SeansCandidate[] = [];
  const seen = new Set<number>();
  for (const item of results) {
    const candidate = normalizeCandidate(item, kind);
    if (candidate && !seen.has(candidate.ref.id)) {
      seen.add(candidate.ref.id);
      out.push(candidate);
    }
  }
  return out;
}

// --- Fetch sarmalayıcıları ---------------------------------------------------

export async function fetchGenres(kind: 'movie' | 'tv'): Promise<Record<number, string>> {
  const raw = await tmdbFetch<{ genres?: Array<{ id?: number; name?: string }> }>(genreListUrl(kind));
  const map: Record<number, string> = {};
  for (const g of raw?.genres ?? []) {
    if (typeof g?.id === 'number' && typeof g?.name === 'string') map[g.id] = g.name;
  }
  return map;
}

export interface ProviderCatalogEntry {
  id: number;
  name: string;
}

export async function fetchProviderCatalog(
  kind: 'movie' | 'tv',
  region: string,
): Promise<ProviderCatalogEntry[]> {
  const raw = await tmdbFetch<{
    results?: Array<{ provider_id?: number; provider_name?: string; display_priorities?: Record<string, number> }>;
  }>(providerCatalogUrl(kind, region));
  const entries = (raw?.results ?? [])
    .filter((p): p is { provider_id: number; provider_name: string; display_priorities?: Record<string, number> } =>
      typeof p?.provider_id === 'number' && typeof p?.provider_name === 'string')
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      priority: p.display_priorities?.[region] ?? Number.MAX_SAFE_INTEGER,
    }));
  entries.sort((a, b) => a.priority - b.priority || a.id - b.id);
  return entries.map(({ id, name }) => ({ id, name }));
}

export interface SeedInfo {
  ref: MediaRef;
  genreIds: number[];
  /** Film: runtime dk; dizi: ilk bölüm süresi dk. */
  minutes: number | null;
}

/** Cinema Universe derin bağlantısı için seed detayı. */
export async function fetchSeedInfo(kind: 'movie' | 'tv', id: number): Promise<SeedInfo> {
  const raw = await tmdbFetch<{
    title?: string;
    name?: string;
    poster_path?: string | null;
    genres?: Array<{ id?: number }>;
    runtime?: number | null;
    episode_run_time?: number[];
  }>(detailUrl(kind, id));
  const title = (raw?.title ?? raw?.name ?? '').trim() || `${kind}:${id}`;
  const minutes =
    typeof raw?.runtime === 'number' && raw.runtime > 0
      ? raw.runtime
      : Array.isArray(raw?.episode_run_time) && raw.episode_run_time.length > 0
        ? raw.episode_run_time[0]
        : null;
  return {
    ref: { kind, id, title, posterPath: raw?.poster_path ?? null },
    genreIds: (raw?.genres ?? []).map((g) => g.id).filter((n): n is number => typeof n === 'number'),
    minutes,
  };
}

/** Tür bilgisini almak için light detail (type: 'movie'|'tv' hedefleri). */
export async function fetchGenreIdsOf(kind: 'movie' | 'tv', id: number): Promise<number[]> {
  const raw = await tmdbFetch<{ genres?: Array<{ id?: number }> }>(detailUrl(kind, id));
  return (raw?.genres ?? []).map((g) => g.id).filter((n): n is number => typeof n === 'number');
}

/**
 * Aday havuzu: DISCOVER_PAGES sayfayı paralel çeker, normalize edip tek
 * deterministik listede birleştirir. Sayfa hatalarından biri gelirse diğer
 * sayfanın sonucu yine de kullanılır; hepsi başarısızsa hata fırlar.
 */
export async function fetchCandidatePool(answers: SeansAnswers): Promise<SeansCandidate[]> {
  const pages = await Promise.allSettled(
    Array.from({ length: DISCOVER_PAGES }, (_, i) =>
      tmdbFetch<Record<string, unknown>>(discoverUrl(answers, i + 1)).then((raw) =>
        normalizeDiscoverPage(raw, answers.kind),
      ),
    ),
  );
  const fulfilled = pages.filter((p): p is PromiseFulfilledResult<SeansCandidate[]> => p.status === 'fulfilled');
  if (fulfilled.length === 0) {
    const reason = (pages[0] as PromiseRejectedResult).reason;
    throw reason instanceof Error ? reason : new SeansApiError('Discover isteği başarısız');
  }
  const merged: SeansCandidate[] = [];
  const seen = new Set<number>();
  for (const page of fulfilled) {
    for (const candidate of page.value) {
      if (!seen.has(candidate.ref.id)) {
        seen.add(candidate.ref.id);
        merged.push(candidate);
      }
    }
  }
  return merged;
}
