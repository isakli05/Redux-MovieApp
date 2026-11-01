/**
 * Başlık üst-verisi (tür/yıl/süre/TMDB ortalaması/kadro) — Cinema DNA'nın
 * boyutları bu verilerle hesaplanır (SHARED_CONTRACTS §E: `lmdb:dna:*` önbellek).
 *
 * Etkileşim günlüğündeki MediaRef yalnızca kind+id taşır; ayrıntılar burada
 * doldurulur ve localStorage'da önbelleklenir. Profil her zaman günlükten
 * yeniden türetilebilir; önbellek kaybı yalnızca yeniden istek demektir.
 */
import { TMDB_CONFIG } from '../../utils/constants';
import { mediaKey, type MediaRef } from '../mediaRef';

export type TitleKind = 'movie' | 'tv';

export interface PersonCredit {
  id: number;
  name: string;
  role: 'cast' | 'director';
}

export interface TitleMeta {
  key: string;
  kind: TitleKind;
  id: number;
  genres: number[];
  year?: number;
  /** Film süresi veya dizinin tipik bölüm süresi (dk). */
  runtime?: number;
  /** TMDB kullanıcı oyları ortalaması (0–10) — puan davranışı kıyası için. */
  voteAverage?: number;
  /** Yalnızca olumlu sinyalli başlıklar için doldurulur (ilk kadro + yönetmen). */
  people?: PersonCredit[];
}

/** key (`movie:550`) → meta. */
export type MetaMap = Record<string, TitleMeta>;

const CACHE_KEY = 'lmdb:dna:meta';
const CACHE_CAP = 400;
const FETCH_CHUNK = 6;
/** Bir profilde en fazla bu kadar başlığın üst-verisi çekilir. */
export const META_FETCH_CAP = 60;
/** Kadro (kişi) verisi yalnızca en güçlü olumlu başlıklar için çekilir. */
export const PEOPLE_FETCH_CAP = 24;

export function loadMetaCache(): MetaMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as MetaMap) : {};
  } catch {
    return {};
  }
}

export function saveMetaCache(map: MetaMap): void {
  try {
    const keys = Object.keys(map);
    if (keys.length > CACHE_CAP) {
      for (const k of keys.slice(0, keys.length - CACHE_CAP)) delete map[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* kota doluysa önbellek yazılmaz — profil yine de türetilir */
  }
}

/** tmdb.api.ts ile aynı kural: production'da api_key, dev'de Vite proxy. */
function tmdbUrl(path: string): string {
  const url = `${TMDB_CONFIG.BASE_URL}${path}`;
  if (import.meta.env.PROD && TMDB_CONFIG.API_KEY) {
    return `${url}${url.includes('?') ? '&' : '?'}api_key=${TMDB_CONFIG.API_KEY}`;
  }
  return url;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(tmdbUrl(path));
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Aynı anahtarın eşzamanlı isteklerini tek sefere indirir (React 18
 * StrictMode etkileri dev'de iki kez çalıştırır; ağ tarafında tek istek).
 */
const inflight = new Map<string, Promise<unknown>>();
function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

interface RawDetails {
  genres?: { id: number }[];
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
}

async function fetchTitleMeta(ref: MediaRef): Promise<TitleMeta | null> {
  if (ref.kind !== 'movie' && ref.kind !== 'tv') return null;
  const raw = await getJson<RawDetails>(`/${ref.kind}/${ref.id}?language=tr-TR`);
  if (!raw) return null;
  const date = ref.kind === 'movie' ? raw.release_date : raw.first_air_date;
  return {
    key: mediaKey(ref),
    kind: ref.kind,
    id: ref.id,
    genres: (raw.genres ?? []).map((g) => g.id).filter((id) => Number.isFinite(id)),
    year: date ? Number(date.slice(0, 4)) : undefined,
    runtime: ref.kind === 'movie' ? raw.runtime : raw.episode_run_time?.[0],
    voteAverage: typeof raw.vote_average === 'number' ? raw.vote_average : undefined,
  };
}

interface RawCredits {
  cast?: { id: number; name: string }[];
  crew?: { id: number; name: string; job?: string }[];
}

async function fetchPeople(ref: MediaRef): Promise<PersonCredit[] | null> {
  if (ref.kind !== 'movie' && ref.kind !== 'tv') return null;
  const raw = await getJson<RawCredits>(`/${ref.kind}/${ref.id}/credits?language=tr-TR`);
  if (!raw) return null;
  const cast = (raw.cast ?? []).slice(0, 6).map((c) => ({ id: c.id, name: c.name, role: 'cast' as const }));
  const directors = (raw.crew ?? [])
    .filter((c) => c.job === 'Director')
    .slice(0, 2)
    .map((c) => ({ id: c.id, name: c.name, role: 'director' as const }));
  return [...directors, ...cast];
}

/**
 * Eksik başlıkların üst-verisini çeker, önbelleğe yazar, güncel haritayı döner.
 * İş yapılacak hedef yoksa aynı referans döner (çağıran no-op olarak anlar).
 */
export async function enrichTitles(refs: MediaRef[], known: MetaMap): Promise<MetaMap> {
  const missing = refs
    .filter((r) => (r.kind === 'movie' || r.kind === 'tv') && !known[mediaKey(r)])
    .slice(0, META_FETCH_CAP);
  if (!missing.length) return known;
  const map: MetaMap = { ...known };
  for (let i = 0; i < missing.length; i += FETCH_CHUNK) {
    const chunk = missing.slice(i, i + FETCH_CHUNK);
    const metas = await Promise.all(
      chunk.map((r) => dedupe(`meta:${mediaKey(r)}`, () => fetchTitleMeta(r))),
    );
    for (const m of metas) {
      if (m) map[m.key] = m;
    }
  }
  saveMetaCache(map);
  return map;
}

/**
 * Verilen başlıkların kadrosunu çeker (var olan meta'nın üzerine yazar).
 * Hedef yoksa aynı referans döner.
 */
export async function enrichPeople(refs: MediaRef[], known: MetaMap): Promise<MetaMap> {
  const targets = refs
    .filter((r) => (r.kind === 'movie' || r.kind === 'tv') && !known[mediaKey(r)]?.people)
    .slice(0, PEOPLE_FETCH_CAP);
  if (!targets.length) return known;
  const map: MetaMap = { ...known };
  for (let i = 0; i < targets.length; i += FETCH_CHUNK) {
    const chunk = targets.slice(i, i + FETCH_CHUNK);
    const peoples = await Promise.all(chunk.map((r) => dedupe(`people:${mediaKey(r)}`, () => fetchPeople(r))));
    peoples.forEach((people, j) => {
      if (!people) return;
      const ref = chunk[j];
      const key = mediaKey(ref);
      map[key] = map[key] ?? { key, kind: ref.kind as TitleKind, id: ref.id, genres: [] };
      map[key].people = people;
    });
  }
  saveMetaCache(map);
  return map;
}
