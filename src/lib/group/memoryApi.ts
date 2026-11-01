/**
 * ⚠️ TESTS ONLY — Bellek içi GroupApi adaptörü. ⚠️
 *
 * Üretim derlemelerinde ASLA kullanılmaz (yalnızca src/test/group/** import
 * eder; uygulama kodu createHttpApi kullanır). Netlify Blobs yerine Map
 * üzerinde, sunucu fonksiyonlarıyla AYNI çekirdek kurallarını (core.ts) ve
 * AYNI anahtar düzenini (room/<code>, part/<code>/<pid>) uygular — katılımcı
 * başına ayrı anahtar sayesinde eşzamanlı oylar birbirini ezmez.
 *
 * İki istemciyi taklit etmek için aynı store üzerinde iki createMemoryApi
 * örneği kullanılır.
 */

import {
  MAX_CANDIDATES,
  MAX_PARTICIPANTS,
  ROOM_TTL_MS,
  admitRate,
  buildView,
  computeResult,
  docKey,
  isValidCodeFormat,
  isValidVoteValue,
  partKey,
  partPrefix,
  randomCode,
  randomHostKey,
  randomPid,
  sanitizeName,
  sanitizeTasteGenres,
  validateConstraints,
  type Candidate,
  type MediaType,
  type ParticipantState,
  type RoomConstraints,
  type RoomDoc,
  type VoteValue,
} from './core';
import { GroupApiError as ApiError, type GroupApi } from './api';

export interface MemoryStore {
  docs: Map<string, string>;
  participants: Map<string, string>;
  /** Test kancası: TTL deneyleri için saati ötele. */
  now(): number;
}

export function createMemoryStore(now: () => number = Date.now): MemoryStore {
  return { docs: new Map(), participants: new Map(), now };
}

function decode<T>(map: Map<string, string>, key: string): T | null {
  const raw = map.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Blobs'taki prefix-list davranışının aynısı. */
function listParticipants(store: MemoryStore, code: string): ParticipantState[] {
  const prefix = partPrefix(code);
  return [...store.participants.keys()]
    .filter((k) => k.startsWith(prefix))
    .map((k) => decode<ParticipantState>(store.participants, k))
    .filter((p): p is ParticipantState => p !== null);
}

export function createMemoryApi(store: MemoryStore): GroupApi {
  // function declarations (never döner) — TS kontrol akışı daraltması için.
  function err(status: number, code: string, message: string): never {
    throw new ApiError(status, code, message);
  }
  function roomNotFound(): never {
    err(404, 'room_not_found', 'Oda bulunamadı ya da süresi geçmiş.');
  }

  /** Süresi dolmuş odayı sil (cleanup-on-access) ve yükle. */
  function loadRoom(code: unknown): { room: RoomDoc; participants: ParticipantState[] } | null {
    if (!isValidCodeFormat(code)) return null;
    const room = decode<RoomDoc>(store.docs, docKey(code));
    if (!room) return null;
    if (room.expiresAt <= store.now()) {
      store.docs.delete(docKey(code));
      for (const k of [...store.participants.keys()]) {
        if (k.startsWith(partPrefix(code))) store.participants.delete(k);
      }
      return null;
    }
    return { room, participants: listParticipants(store, code) };
  }

  function saveRoom(room: RoomDoc): void {
    store.docs.set(docKey(room.code), JSON.stringify(room));
  }

  function saveParticipant(code: string, p: ParticipantState): void {
    store.participants.set(partKey(code, p.pid), JSON.stringify(p));
  }

  function findMe(loaded: NonNullable<ReturnType<typeof loadRoom>>, pid: unknown): ParticipantState {
    const me = loaded.participants.find((p) => p.pid === pid);
    if (!me) err(404, 'not_in_room', 'Katılımcı bulunamadı; odaya yeniden katıl.');
    return me;
  }

  function hostOk(room: RoomDoc, hostKey: unknown): void {
    if (typeof hostKey !== 'string' || hostKey !== room.hostKey) {
      err(403, 'not_host', 'Bu işlem için ev sahibi olmalısın.');
    }
  }

  /** Sunucudaki discover'un bellek versiyonu — test verisi üretir. */
  function fakeDiscover(constraints: RoomConstraints, seed: unknown): { candidates: Candidate[]; page: number } {
    const page = typeof seed === 'number' && seed >= 1 && seed <= 5 ? seed : 2;
    const genre = constraints.genres[0] ?? (constraints.mediaType === 'movie' ? 18 : 10759);
    const candidates: Candidate[] = Array.from({ length: MAX_CANDIDATES }, (_, i) => {
      const id = page * 1000 + i;
      return {
        key: `${constraints.mediaType}:${id}`,
        kind: constraints.mediaType as MediaType,
        id,
        title: `Test Adayı ${page}-${i + 1}`,
        posterPath: `/test${i}.jpg`,
        year: 2000 + ((page * 7 + i * 3) % 24),
        genreIds: [genre, 35],
        voteAverage: 5 + ((i * 13 + page) % 50) / 10,
        overview: `Sayfa ${page} aday ${i + 1}.`,
      };
    });
    // maxRuntime kısıtı film için sunucuda filtrelidir; burada da uygula.
    return {
      page,
      candidates: constraints.mediaType === 'movie' && constraints.maxRuntime !== null
        ? candidates.slice(0, 8)
        : candidates,
    };
  }

  return {
    async createRoom(input) {
      const name = sanitizeName(input?.name) ?? 'Ev Sahibi';
      const constraints = validateConstraints(input?.constraints);
      if (constraints === null) err(400, 'invalid_constraints', 'Kısıtlar geçersiz.');
      let code = randomCode();
      while (store.docs.has(docKey(code))) code = randomCode();
      const now = store.now();
      const pid = randomPid();
      const hostKey = randomHostKey();
      const room: RoomDoc = {
        code, hostKey, phase: 'gathering', constraints, candidates: [],
        createdAt: now, expiresAt: now + ROOM_TTL_MS, candidatePage: 1, result: null,
      };
      const host: ParticipantState = {
        pid, name, isHost: true, joinedAt: now, lastSeen: now,
        tasteGenres: [], votes: {}, rate: [],
      };
      saveRoom(room);
      saveParticipant(code, host);
      return { code, pid, hostKey, view: buildView(room, [host], pid, now) };
    },

    async joinRoom(code, name, tasteGenres) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      const clean = sanitizeName(name);
      if (!clean) err(400, 'invalid_name', '1-24 karakter arası bir ad gerekli.');
      if (loaded.room.phase !== 'gathering') {
        err(409, 'join_closed', 'Oylama başladı; artık yeni katılım yok.');
      }
      if (loaded.participants.length >= MAX_PARTICIPANTS) {
        err(409, 'room_full', `Oda dolu (en çok ${MAX_PARTICIPANTS} kişi).`);
      }
      const now = store.now();
      const participant: ParticipantState = {
        pid: randomPid(), name: clean, isHost: false, joinedAt: now, lastSeen: now,
        tasteGenres: sanitizeTasteGenres(tasteGenres), votes: {}, rate: [],
      };
      saveParticipant(loaded.room.code, participant);
      return {
        pid: participant.pid,
        view: buildView(loaded.room, [...loaded.participants, participant], participant.pid, now),
      };
    },

    async getRoom(code, pid) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      const me = findMe(loaded, pid);
      const view = buildView(loaded.room, loaded.participants, me.pid, store.now());
      return view;
    },

    async setConstraints(code, hostKey, pid, constraints) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      hostOk(loaded.room, hostKey);
      if (loaded.room.phase !== 'gathering') {
        err(409, 'phase', 'Kısıtlar yalnız toplama fazında değişebilir.');
      }
      const clean = validateConstraints(constraints);
      if (clean === null) err(400, 'invalid_constraints', 'Kısıtlar geçersiz.');
      loaded.room.constraints = clean;
      saveRoom(loaded.room);
      return buildView(loaded.room, loaded.participants, findMe(loaded, pid).pid, store.now());
    },

    async generateCandidates(code, hostKey, pid, seed) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      hostOk(loaded.room, hostKey);
      if (loaded.room.phase !== 'gathering') {
        err(409, 'phase', 'Adaylar yalnız toplama fazında üretilebilir.');
      }
      const found = fakeDiscover(loaded.room.constraints, seed);
      loaded.room.candidates = found.candidates;
      loaded.room.candidatePage = found.page;
      saveRoom(loaded.room);
      return buildView(loaded.room, loaded.participants, findMe(loaded, pid).pid, store.now());
    },

    async setPhase(code, hostKey, pid, phase: 'voting' | 'reveal') {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      hostOk(loaded.room, hostKey);
      const now = store.now();
      if (phase === 'voting') {
        if (loaded.room.phase !== 'gathering') err(409, 'phase', 'Oylama yalnız toplama fazından başlar.');
        if (loaded.room.candidates.length < 2) err(409, 'no_candidates', 'Önce en az iki aday üret.');
        loaded.room.phase = 'voting';
      } else {
        if (loaded.room.phase !== 'voting') err(409, 'phase', 'Sonuç yalnız oylama fazından açıklanır.');
        loaded.room.phase = 'reveal';
        loaded.room.result = computeResult(loaded.room.candidates, loaded.participants, now);
      }
      saveRoom(loaded.room);
      return buildView(loaded.room, loaded.participants, findMe(loaded, pid).pid, now);
    },

    async vote(code, pid, key, value: VoteValue) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      const me = findMe(loaded, pid);
      if (loaded.room.phase !== 'voting') err(409, 'phase', 'Şu an oylama açık değil.');
      if (!loaded.room.candidates.some((c) => c.key === key)) {
        err(400, 'invalid_vote', 'Bilinmeyen aday.');
      }
      if (!isValidVoteValue(value)) err(400, 'invalid_vote', 'Geçersiz oy.');
      const now = store.now();
      const decision = admitRate(me.rate, now);
      me.rate = decision.rate;
      if (!decision.ok) {
        saveParticipant(loaded.room.code, me);
        err(429, 'rate_limited', 'Çok hızlı; kısa bir nefes al.');
      }
      me.votes[key] = value;
      me.lastSeen = now;
      saveParticipant(loaded.room.code, me);
      return buildView(loaded.room, listParticipants(store, loaded.room.code), me.pid, now);
    },

    async attachTaste(code, pid, genres) {
      const loaded = loadRoom(code);
      if (!loaded) roomNotFound();
      const me = findMe(loaded, pid);
      me.tasteGenres = sanitizeTasteGenres(genres);
      saveParticipant(loaded.room.code, me);
      return buildView(loaded.room, listParticipants(store, loaded.room.code), me.pid, store.now());
    },

    async providers() {
      return [
        { id: 8, name: 'Netflix' },
        { id: 9, name: 'Amazon Prime Video' },
        { id: 337, name: 'Disney+' },
      ];
    },
  };
}
