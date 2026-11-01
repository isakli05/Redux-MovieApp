/**
 * Birlikte İzle — odaya katılma (kayıtsız misafir).
 *
 * Route        : POST /api/rooms/join   body {code, name, tasteGenres?}
 * Rules        : yalnız 'gathering' fazında geç katılım; kod yanlışsa/expired
 *                → poll ile AYNI 404 (oda varlığını ifşa etme); IP limiti.
 */

import {
  apiError,
  isMutationAuthorized,
  json,
  readJsonBody,
} from './_shared/tmdb';
import {
  MAX_NAME_LEN,
  MAX_PARTICIPANTS,
  buildView,
  randomPid,
  sanitizeName,
  sanitizeTasteGenres,
  type ParticipantState,
} from '../../src/lib/group/core';
import { admitIp, clientIp, loadRoom, roomNotFound, saveParticipant, storageError, type RoomContext } from './rooms';

export const config = { path: '/api/rooms/join' };

export default (async (req: Request, context: RoomContext): Promise<Response> => {
  if (req.method !== 'POST') return apiError(405, 'method_not_allowed');
  if (!isMutationAuthorized(req)) return apiError(403, 'forbidden');
  if (!admitIp(clientIp(req))) {
    return apiError(429, 'rate_limited', 'Çok fazla deneme; bir dakika sonra tekrar dene.');
  }
  const body = await readJsonBody(req);
  if (!body) return apiError(400, 'invalid_body', 'Geçersiz istek gövdesi.');

  let loaded;
  try {
    loaded = await loadRoom(context, body.code);
  } catch (e) {
    return storageError(e);
  }
  if (!loaded) return roomNotFound();

  const name = sanitizeName(body.name);
  if (!name) {
    return apiError(400, 'invalid_name', `1-${MAX_NAME_LEN} karakter arası bir ad gerekli.`);
  }
  if (loaded.room.phase !== 'gathering') {
    return apiError(409, 'join_closed', 'Oylama başladı; artık yeni katılım yok.');
  }
  if (loaded.participants.length >= MAX_PARTICIPANTS) {
    return apiError(409, 'room_full', `Oda dolu (en çok ${MAX_PARTICIPANTS} kişi).`);
  }

  const now = Date.now();
  const participant: ParticipantState = {
    pid: randomPid(),
    name,
    isHost: false,
    joinedAt: now,
    lastSeen: now,
    tasteGenres: sanitizeTasteGenres(body.tasteGenres),
    votes: {},
    rate: [],
  };
  try {
    await saveParticipant(context, loaded.room.code, participant);
  } catch (e) {
    return storageError(e);
  }
  return json(200, {
    pid: participant.pid,
    view: buildView(loaded.room, [...loaded.participants, participant], participant.pid, now),
  });
});
