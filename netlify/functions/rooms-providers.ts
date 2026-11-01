/**
 * Birlikte İzle — yayın sağlayıcı listesi (kısıt seçimi için).
 *
 * Route        : GET /api/rooms/providers?mediaType=movie&region=TR
 * TMDB calls   : GET /3/watch/providers/{movie|tv}?watch_region=
 * Note         : örnek başına 10 dk önbellek (TMDB bu listeyi yavaş değiştirir).
 */

import { apiError, json, tmdb, type FunctionHandler } from './_shared/tmdb';

export const config = { path: '/api/rooms/providers' };

interface ProviderEntry {
  id: number;
  name: string;
}

const cache = new Map<string, { at: number; providers: ProviderEntry[] }>();
const TTL_MS = 10 * 60 * 1000;

export default (async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') return apiError(405, 'method_not_allowed');
  const url = new URL(req.url);
  const mediaType = url.searchParams.get('mediaType') === 'tv' ? 'tv' : 'movie';
  const region = url.searchParams.get('region') ?? 'TR';
  if (!/^[A-Z]{2}$/.test(region)) return apiError(400, 'invalid_argument', 'Geçersiz bölge.');

  const cacheKey = `${mediaType}:${region}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return json(200, { providers: hit.providers });

  const result = await tmdb(`/watch/providers/${mediaType}`, { query: { watch_region: region } });
  if (!result.ok || !Array.isArray(result.data.results)) {
    return apiError(502, 'upstream_unavailable', 'Sağlayıcı listesi yüklenemedi.');
  }
  const providers: ProviderEntry[] = (result.data.results as Record<string, unknown>[])
    .filter((r) => typeof r.provider_id === 'number' && typeof r.provider_name === 'string')
    // İlk 24 sağlayıcı yeter — liste yüzlerce uzun kuyruk içerir.
    .slice(0, 24)
    .map((r) => ({ id: r.provider_id as number, name: r.provider_name as string }));
  cache.set(cacheKey, { at: Date.now(), providers });
  return json(200, { providers });
}) satisfies FunctionHandler;
