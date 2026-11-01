/**
 * Birlikte İzle — room creation + state polling.
 *
 * Route        : POST /api/rooms            body {name?, constraints?}
 *                GET  /api/rooms?code=&pid=   (poll, ≤5 s istemci aralığı)
 * Storage      : Netlify Blobs store `group-rooms` (SHARED_CONTRACTS §E)
 *                room/<code> → RoomDoc, part/<code>/<pid> → ParticipantState
 *                Erişim `@netlify/blobs` getStore ile (üretimde çalışma zamanı
 *                kimlik bilgilerini enjekte eder; `netlify dev` yerelde öykünür).
 * Privacy      : oda kodu tahmin edilemez (31^6), eksik/süresi geçmiş oda
 *                aynı sanitize edilmiş 404 ile döner (enumeration yok);
 *                hostKey yalnız ev sahibi istemciye bir kez verilir.
 */

import { getStore, type Store } from '@netlify/blobs';
import {
  apiError,
  isMutationAuthorized,
  json,
  readJsonBody,
  type FunctionContext,
} from './_shared/tmdb';
import {
  ROOM_TTL_MS,
  buildView,
  docKey,
  isValidCodeFormat,
  partKey,
  partPrefix,
  randomCode,
  randomHostKey,
  randomPid,
  sanitizeName,
  validateConstraints,
  type ParticipantState,
  type RoomDoc,
  type RoomView,
} from '../../src/lib/group/core';

export const config = { path: '/api/rooms' };

// ---------------------------------------------------------------------------
// Blobs access

export type RoomContext = FunctionContext;

/** Oda deposu — kimlik bilgilerini Netlify çalışma zamanı sağlar. */
export async function blobsStore(): Promise<Store> {
  return getStore('group-rooms');
}

/** Blobs katmanı hatalarını istemciye sanitize ederek ilet (ayrıntı yalnız sunucu günlüğünde). */
export function storageError(e: unknown): Response {
  console.error('[rooms] blobs failure:', e instanceof Error ? `${e.name}: ${e.message}` : e);
  // Yapılandırma eksikliği (ör. blobs site için kapalı) dağıtım hatasıdır → 503.
  if (e instanceof Error && /credential|configured/i.test(e.message)) {
    return apiError(503, 'storage_unavailable', 'Oda deposu şu an hazır değil; biraz sonra tekrar dene.');
  }
  return apiError(500, 'storage_error', 'Oda deposuna erişilemedi; biraz sonra tekrar dene.');
}

// ---------------------------------------------------------------------------
// Shared server helpers (imported by the other rooms-*.ts functions)

async function purgeRoom(context: RoomContext, code: string): Promise<void> {
  const s = await blobsStore();
  await s.delete(docKey(code));
  const listed = await s.list({ prefix: partPrefix(code) });
  for (const b of listed.blobs) await s.delete(b.key);
}

export interface LoadedRoom {
  room: RoomDoc;
  participants: ParticipantState[];
}

/**
 * Odayı yükle. Geçersiz format / yok / süresi dolmuş → null (çağıran tek tip
 * 404 döner). Süresi dolmuşsa önce silinir.
 */
export async function loadRoom(context: RoomContext, code: unknown): Promise<LoadedRoom | null> {
  if (!isValidCodeFormat(code)) return null;
  const s = await blobsStore();
  // type:'text' — options'suz çağrı SDK tipinde ArrayBuffer aşırı yüküne düşer.
  const raw = await s.get(docKey(code), { type: 'text' });
  if (!raw) return null;
  let room: RoomDoc;
  try {
    room = JSON.parse(raw) as RoomDoc;
  } catch {
    return null;
  }
  const now = Date.now();
  if (typeof room.expiresAt !== 'number' || room.expiresAt <= now) {
    await purgeRoom(context, code);
    return null;
  }
  const listed = await s.list({ prefix: partPrefix(code) });
  const participants: ParticipantState[] = [];
  for (const b of listed.blobs) {
    const v = await s.get(b.key, { type: 'text' });
    if (!v) continue;
    try {
      participants.push(JSON.parse(v) as ParticipantState);
    } catch {
      /* bozuk katılımcı kaydı — yok say */
    }
  }
  return { room, participants };
}

export async function saveRoom(context: RoomContext, room: RoomDoc): Promise<void> {
  const s = await blobsStore();
  await s.set(docKey(room.code), JSON.stringify(room));
}

export async function saveParticipant(context: RoomContext, code: string, p: ParticipantState): Promise<void> {
  const s = await blobsStore();
  await s.set(partKey(code, p.pid), JSON.stringify(p));
}

export const ROOM_NOT_FOUND_MSG = 'Oda bulunamadı ya da süresi geçmiş.';

/** hostKey karşılaştırması — uzunluk farkı sızmadan, sabit zamanlı. */
export function hostKeyMatches(room: RoomDoc, provided: unknown): boolean {
  if (typeof provided !== 'string' || provided.length !== room.hostKey.length) return false;
  let diff = 0;
  for (let i = 0; i < room.hostKey.length; i++) diff |= room.hostKey.charCodeAt(i) !== provided.charCodeAt(i) ? 1 : 0;
  return diff === 0;
}

/** Bulunan oda + katılımcı için görünüm; katılımcı yoksa null. */
export async function viewFor(loaded: LoadedRoom, pid: unknown): Promise<RoomView | null> {
  const me = loaded.participants.find((p) => p.pid === pid);
  if (!me) return null;
  return buildView(loaded.room, loaded.participants, me.pid, Date.now());
}

/**
 * Örnek-başı ağ limiti (savunma derinliği): kod denemesi/SPAM join'e perde.
 * Kod zaten 31^6 tahmin edilemez; bu, ucuz ikinci bir katman.
 */
const ipHits = new Map<string, number[]>();
const IP_WINDOW_MS = 60_000;
const IP_MAX = 30;

export function admitIp(ip: string, now = Date.now()): boolean {
  const window = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (window.length >= IP_MAX) {
    ipHits.set(ip, window);
    return false;
  }
  window.push(now);
  ipHits.set(ip, window);
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export function roomNotFound(): Response {
  return apiError(404, 'room_not_found', ROOM_NOT_FOUND_MSG);
}

// ---------------------------------------------------------------------------
// Handlers

async function createRoom(req: Request, context: RoomContext): Promise<Response> {
  if (!isMutationAuthorized(req)) return apiError(403, 'forbidden');
  if (!admitIp(clientIp(req))) return apiError(429, 'rate_limited', 'Çok fazla istek; bir dakika sonra tekrar dene.');
  const body = (await readJsonBody(req)) ?? {};
  const name = sanitizeName(body.name) ?? 'Ev Sahibi';
  const constraints = validateConstraints(body.constraints);
  if (constraints === null) return apiError(400, 'invalid_constraints', 'Kısıtlar geçersiz.');

  try {
    const s = await blobsStore();
    const now = Date.now();
    // Kod çarpışması: kontrol et, gerekirse yeniden dene (31^6 → pratikte nadir).
    let code = randomCode();
    for (let i = 0; i < 5 && (await s.get(docKey(code))) !== null; i++) code = randomCode();

    const pid = randomPid();
    const hostKey = randomHostKey();
    const room: RoomDoc = {
      code,
      hostKey,
      phase: 'gathering',
      constraints,
      candidates: [],
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      candidatePage: 1,
      result: null,
    };
    const host: ParticipantState = {
      pid,
      name,
      isHost: true,
      joinedAt: now,
      lastSeen: now,
      tasteGenres: [],
      votes: {},
      rate: [],
    };
    await saveRoom(context, room);
    await saveParticipant(context, code, host);
    return json(201, { code, pid, hostKey, view: buildView(room, [host], pid, now) });
  } catch (e) {
    return storageError(e);
  }
}

async function pollRoom(req: Request, context: RoomContext): Promise<Response> {
  const url = new URL(req.url);
  let loaded: LoadedRoom | null;
  try {
    loaded = await loadRoom(context, url.searchParams.get('code'));
  } catch (e) {
    return storageError(e);
  }
  if (!loaded) return roomNotFound();
  const view = await viewFor(loaded, url.searchParams.get('pid'));
  if (!view) {
    return apiError(404, 'not_in_room', 'Katılımcı bulunamadı; odaya yeniden katıl.');
  }
  // lastSeen güncelle (en iyi çaba) — ek yazma maliyeti kabul, görünürlük yok.
  const me = loaded.participants.find((p) => p.pid === view.me.pid);
  if (me) {
    me.lastSeen = Date.now();
    await saveParticipant(context, loaded.room.code, me).catch(() => undefined);
  }
  return json(200, view);
}

export default (async (req: Request, context: RoomContext): Promise<Response> => {
  if (req.method === 'POST') return createRoom(req, context);
  if (req.method === 'GET') return pollRoom(req, context);
  return apiError(405, 'method_not_allowed');
});
