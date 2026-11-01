/**
 * Birlikte İzle — ev sahibi eylemleri (hostKey gerekir).
 *
 * Route        : POST /api/rooms/manage
 *                body {code, hostKey, action}
 *                action 'constraints'  {constraints}
 *                action 'candidates'   {seed?}   → BFF üzerinden TMDB discover
 *                action 'phase'        {phase: 'voting'|'reveal'}
 * Rules        : kısıt/aday yalnız 'gathering' fazında; faz yalnız ileri;
 *                'reveal'de sonuç sunucuda hesaplanıp oda belgesine yazılır —
 *                tüm istemciler aynı geçişi poll'da görür.
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  readJsonBody,
  tmdb,
} from './_shared/tmdb';
import {
  MAX_CANDIDATES,
  buildView,
  computeResult,
  validateConstraints,
  type Candidate,
  type MediaType,
} from '../../src/lib/group/core';
import {
  hostKeyMatches,
  loadRoom,
  roomNotFound,
  saveRoom,
  storageError,
  viewFor,
  type RoomContext,
} from './rooms';

export const config = { path: '/api/rooms/manage' };

const OVERVIEW_MAX = 280;

function mapCandidates(mediaType: MediaType, results: unknown[]): Candidate[] {
  const out: Candidate[] = [];
  for (const r of results) {
    const row = r as Record<string, unknown>;
    const id = row.id;
    const title = mediaType === 'movie' ? row.title : row.name;
    const date = mediaType === 'movie' ? row.release_date : row.first_air_date;
    if (typeof id !== 'number' || typeof title !== 'string' || !title) continue;
    if (typeof row.poster_path !== 'string') continue; // görselsiz aday kullanılamaz
    const overview = typeof row.overview === 'string' ? row.overview.slice(0, OVERVIEW_MAX) : '';
    out.push({
      key: `${mediaType}:${id}`,
      kind: mediaType,
      id,
      title,
      posterPath: row.poster_path,
      year: typeof date === 'string' && date.length >= 4 ? Number.parseInt(date.slice(0, 4), 10) : null,
      genreIds: Array.isArray(row.genre_ids)
        ? row.genre_ids.filter((g): g is number => typeof g === 'number')
        : [],
      voteAverage: typeof row.vote_average === 'number' ? row.vote_average : 0,
      overview,
    });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

/** TMDB discover (BFF üzerinden — tarayıcı asla api.themoviedb.org'ye gitmez). */
async function discover(constraints: {
  mediaType: MediaType;
  maxRuntime: number | null;
  genres: number[];
  region: string;
  providers: number[];
}, seed: unknown): Promise<{ candidates: Candidate[]; page: number } | null> {
  const page = typeof seed === 'number' && Number.isInteger(seed) && seed >= 1 && seed <= 5
    ? seed
    : 1 + Math.floor(Math.random() * 3); // popülarite sıralamada ilk 3 sayfa yeterli çeşitlilik
  const seg = constraints.mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
  const query: Record<string, string | number> = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    language: 'tr-TR',
    'vote_count.gte': 150,
    page,
  };
  if (constraints.genres.length > 0) query.with_genres = constraints.genres.join('|');
  if (constraints.providers.length > 0) {
    query.watch_region = constraints.region;
    query.with_watch_providers = constraints.providers.join('|');
  }
  // Film: süre filtresi discover'da var; TV: bölüm süresi için karşılığı yok.
  if (constraints.mediaType === 'movie' && constraints.maxRuntime !== null) {
    query['with_runtime.lte'] = constraints.maxRuntime;
  }
  const result = await tmdb(seg, { query });
  if (!result.ok || !Array.isArray(result.data.results)) return null;
  const candidates = mapCandidates(constraints.mediaType, result.data.results);
  return { candidates, page };
}

export default (async (req: Request, context: RoomContext): Promise<Response> => {
  if (req.method !== 'POST') return apiError(405, 'method_not_allowed');
  if (!isMutationAuthorized(req)) return apiError(403, 'forbidden');
  const body = await readJsonBody(req);
  if (!body) return apiError(400, 'invalid_body', 'Geçersiz istek gövdesi.');

  let loaded;
  try {
    loaded = await loadRoom(context, body.code);
  } catch (e) {
    return storageError(e);
  }
  if (!loaded) return roomNotFound();
  const { room, participants } = loaded;
  if (!hostKeyMatches(room, body.hostKey)) {
    return apiError(403, 'not_host', 'Bu işlem için ev sahibi olmalısın.');
  }

  const now = Date.now();

  try {
    if (body.action === 'constraints') {
      if (room.phase !== 'gathering') {
        return apiError(409, 'phase', 'Kısıtlar yalnız toplama fazında değişebilir.');
      }
      const constraints = validateConstraints(body.constraints);
      if (constraints === null) return apiError(400, 'invalid_constraints', 'Kısıtlar geçersiz.');
      room.constraints = constraints;
      await saveRoom(context, room);
    } else if (body.action === 'candidates') {
      if (room.phase !== 'gathering') {
        return apiError(409, 'phase', 'Adaylar yalnız toplama fazında üretilebilir.');
      }
      const found = await discover(room.constraints, body.seed);
      if (!found || found.candidates.length === 0) {
        return apiError(502, 'upstream_unavailable', 'Adaylar yüklenemedi; kısıtları gevşetip tekrar dene.');
      }
      room.candidates = found.candidates;
      room.candidatePage = found.page;
      await saveRoom(context, room);
    } else if (body.action === 'phase') {
      const target = body.phase;
      if (target === 'voting') {
        if (room.phase !== 'gathering') return apiError(409, 'phase', 'Oylama yalnız toplama fazından başlar.');
        if (room.candidates.length < 2) {
          return apiError(409, 'no_candidates', 'Önce en az iki aday üret.');
        }
        room.phase = 'voting';
      } else if (target === 'reveal') {
        if (room.phase !== 'voting') return apiError(409, 'phase', 'Sonuç yalnız oylama fazından açıklanır.');
        room.phase = 'reveal';
        room.result = computeResult(room.candidates, participants, now);
      } else {
        return apiError(400, 'invalid_phase', 'Geçersiz faz.');
      }
      await saveRoom(context, room);
    } else {
      return apiError(400, 'invalid_action', 'Geçersiz işlem.');
    }
  } catch (e) {
    return storageError(e);
  }

  const view = await viewFor({ room, participants }, body.pid ?? participants.find((p) => p.isHost)?.pid);
  if (!view) return roomNotFound();
  return json(200, { view });
});
