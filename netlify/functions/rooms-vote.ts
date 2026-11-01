/**
 * Birlikte İzle — oy verme ve anonim DNA özeti bağlama.
 *
 * Route        : POST /api/rooms/vote
 *                body {code, pid, vote?: {key, value}, tasteGenres?}
 * Rules        : oy yalnız 'voting' fazında ve aday listesindeki anahtara;
 *                katılımcı başına hız limiti (admitRate); DNA yalnız kendi
 *                oylarını ağırlaştırır — başka katılımcının verisi asla dönmez.
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  readJsonBody,
} from './_shared/tmdb';
import {
  admitRate,
  buildView,
  isValidVoteValue,
  sanitizeTasteGenres,
} from '../../src/lib/group/core';
import { loadRoom, roomNotFound, saveParticipant, storageError, type RoomContext } from './rooms';

export const config = { path: '/api/rooms/vote' };

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
  const me = participants.find((p) => p.pid === body.pid);
  if (!me) {
    return apiError(404, 'not_in_room', 'Katılımcı bulunamadı; odaya yeniden katıl.');
  }

  const now = Date.now();
  let mutated = false;

  if (body.vote !== undefined && body.vote !== null) {
    if (room.phase !== 'voting') {
      return apiError(409, 'phase', 'Şu an oylama açık değil.');
    }
    const vote = body.vote as Record<string, unknown>;
    if (typeof vote.key !== 'string' || !room.candidates.some((c) => c.key === vote.key)) {
      return apiError(400, 'invalid_vote', 'Bilinmeyen aday.');
    }
    if (!isValidVoteValue(vote.value)) {
      return apiError(400, 'invalid_vote', 'Geçersiz oy.');
    }
    const decision = admitRate(me.rate, now);
    me.rate = decision.rate;
    if (!decision.ok) {
      await saveParticipant(context, room.code, me).catch(() => undefined);
      return apiError(429, 'rate_limited', 'Çok hızlı; kısa bir nefes al.');
    }
    me.votes[vote.key] = vote.value;
    me.lastSeen = now;
    mutated = true;
  }

  if (body.tasteGenres !== undefined && body.tasteGenres !== null) {
    me.tasteGenres = sanitizeTasteGenres(body.tasteGenres);
    me.lastSeen = now;
    mutated = true;
  }

  if (!mutated) return apiError(400, 'invalid_body', 'Oy ya da DNA özeti gerekli.');

  try {
    await saveParticipant(context, room.code, me);
  } catch (e) {
    return storageError(e);
  }
  return json(200, { view: buildView(room, participants, me.pid, now) });
});
