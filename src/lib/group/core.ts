/**
 * Birlikte İzle — shared room core (SHARED_CONTRACTS §E).
 *
 * Pure logic only: types, validation, rate limiting, code/id generation and
 * result scoring. Imported by BOTH the server functions
 * (netlify/functions/rooms*.ts) and the test-only memory adapter
 * (src/lib/group/memoryApi.ts), so the rules exist exactly once.
 *
 * No DOM, no fetch, no Netlify imports — must compile under the functions
 * tsconfig (ES2022 + node types) as well as the app tsconfig.
 */

export type MediaType = 'movie' | 'tv';
export type VoteValue = 'strong' | 'like' | 'skip' | 'dislike';
export type Phase = 'gathering' | 'voting' | 'reveal';

export const VOTE_VALUES: readonly VoteValue[] = ['strong', 'like', 'skip', 'dislike'];

export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_CANDIDATES = 12;
export const MAX_PARTICIPANTS = 12;
export const MAX_NAME_LEN = 24;
export const MAX_GENRES = 4;
export const MAX_PROVIDERS = 6;
export const REGIONS: readonly string[] = ['TR', 'US', 'DE', 'GB'];

/** Code alphabet: no I, L, O, 0, 1 (ambiguity) — 31 unguessable chars. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 6;

/** Per-participant vote rate limit (anti-spam + enumeration friction). */
export const RATE_MIN_INTERVAL_MS = 250;
export const RATE_WINDOW_MS = 8000;
export const RATE_MAX_IN_WINDOW = 15;

// ---------------------------------------------------------------------------
// Documents

export interface RoomConstraints {
  mediaType: MediaType;
  /** Dakika; null = uzunluk sınırı yok (film için discover filtresi). */
  maxRuntime: number | null;
  genres: number[];
  /** Watch-provider bölgesi (ISO 3166-1 alpha-2). */
  region: string;
  providers: number[];
}

export interface Candidate {
  /** `${kind}:${id}` — mediaRef.ts ile aynı kurallı anahtar. */
  key: string;
  kind: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  year: number | null;
  genreIds: number[];
  voteAverage: number;
  overview: string;
}

export interface ParticipantState {
  pid: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  lastSeen: number;
  /** Anonim DNA özeti: sadece tür id'leri (SHARED_CONTRACTS §H). */
  tasteGenres: number[];
  votes: Record<string, VoteValue>;
  /** Rate-limit penceresi için son işlemlerin epoch ms damgaları. */
  rate: number[];
}

export interface RoomDoc {
  code: string;
  hostKey: string;
  phase: Phase;
  constraints: RoomConstraints;
  candidates: Candidate[];
  createdAt: number;
  expiresAt: number;
  candidatePage: number;
  result: RoomResult | null;
}

export interface RoomResultEntry {
  key: string;
  kind: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  year: number | null;
  strong: number;
  like: number;
  skip: number;
  dislike: number;
  score: number;
  mutual: boolean;
  vetoed: boolean;
  /** En az bir oy, DNA takviyesi ile sayıldı. */
  boosted: boolean;
}

export interface RoomResult {
  at: number;
  winner: RoomResultEntry | null;
  ranking: RoomResultEntry[];
  tie: boolean;
  reason: 'match' | 'compromise' | 'tie' | 'all_vetoed' | 'no_votes';
}

// ---------------------------------------------------------------------------
// Client-facing views (server assembles; never leaks hostKey or others' votes
// before reveal)

export interface ParticipantView {
  pid: string;
  name: string;
  isHost: boolean;
  votedCount: number;
  tasteAttached: boolean;
}

export interface RoomView {
  code: string;
  phase: Phase;
  constraints: RoomConstraints;
  candidates: Candidate[];
  participants: ParticipantView[];
  me: { pid: string; isHost: boolean; myVotes: Record<string, VoteValue>; tasteGenres: number[] };
  result: RoomResult | null;
  createdAt: number;
  expiresAt: number;
  /** Sunucu saati (epoch ms) — istemci TTL hesabında saat kaymasını önler. */
  serverNow: number;
}

// ---------------------------------------------------------------------------
// Generation (crypto-random where available; Math.random fallback for tests)

function randomChars(len: number, alphabet: string): string {
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } };
  let out = '';
  for (let i = 0; i < len; i++) {
    if (g.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      g.crypto.getRandomValues(buf);
      out += alphabet[buf[0] % alphabet.length];
    } else {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return out;
}

const PID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** 6 haneli, tahmin edilemez oda kodu (belirsiz karakterler hariç). */
export function randomCode(): string {
  return randomChars(CODE_LEN, CODE_ALPHABET);
}

/** `p_<10 char>` — odaya scoped opak katılımcı kimliği (SHARED_CONTRACTS §A). */
export function randomPid(): string {
  return `p_${randomChars(10, PID_ALPHABET)}`;
}

/** Sadece ev sahibi istemcinin tuttuğu gizli anahtar. */
export function randomHostKey(): string {
  return `h_${randomChars(24, PID_ALPHABET)}`;
}

export function isValidCodeFormat(code: unknown): code is string {
  return typeof code === 'string' && code.length === CODE_LEN &&
    [...code].every((c) => CODE_ALPHABET.includes(c));
}

// ---------------------------------------------------------------------------
// Validation

/** Görünen ad: kırp, boşlukları sıkıştır, kontrol karakterlerini at. */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 1 && cleaned.length <= MAX_NAME_LEN ? cleaned : null;
}

function intArray(raw: unknown, max: number): number[] | null {
  if (raw === undefined || raw === null) return []; // belirtilmemiş = boş seçim
  if (!Array.isArray(raw) || raw.length > max) return null;
  const out: number[] = [];
  for (const v of raw) {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 100000) return null;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

export function defaultConstraints(): RoomConstraints {
  return { mediaType: 'movie', maxRuntime: null, genres: [], region: 'TR', providers: [] };
}

/** Güvenilmeyen girdiden kısıt nesnesi; geçersizse null. */
export function validateConstraints(raw: unknown): RoomConstraints | null {
  if (raw === null || raw === undefined) return defaultConstraints();
  if (typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const mediaType = r.mediaType === 'tv' ? 'tv' : r.mediaType === 'movie' ? 'movie' : null;
  if (!mediaType) return null;
  let maxRuntime: number | null = null;
  if (r.maxRuntime !== null && r.maxRuntime !== undefined) {
    if (typeof r.maxRuntime !== 'number' || !Number.isInteger(r.maxRuntime) ||
      r.maxRuntime < 40 || r.maxRuntime > 300) return null;
    maxRuntime = r.maxRuntime;
  }
  const genres = intArray(r.genres, MAX_GENRES);
  if (!genres) return null;
  const providers = intArray(r.providers, MAX_PROVIDERS);
  if (!providers) return null;
  const region = typeof r.region === 'string' && REGIONS.includes(r.region) ? r.region : null;
  if (!region) return null;
  return { mediaType, maxRuntime, genres, providers, region };
}

export function isValidVoteValue(v: unknown): v is VoteValue {
  return v === 'strong' || v === 'like' || v === 'skip' || v === 'dislike';
}

/** DNA özeti olarak kabul edilebilir tür listesi (sadece id'ler, ≤8). */
export function sanitizeTasteGenres(raw: unknown): number[] {
  const arr = intArray(raw, 8);
  return arr ?? [];
}

// ---------------------------------------------------------------------------
// Rate limiting (per participant)

export interface RateDecision {
  ok: boolean;
  rate: number[];
}

/** Aynı katılımcının ardışık işlemlerini sınırla; pencereyi bud, damgayı ekle. */
export function admitRate(rate: number[], now: number): RateDecision {
  const window = rate.filter((t) => now - t < RATE_WINDOW_MS);
  if (window.length > 0 && now - window[window.length - 1] < RATE_MIN_INTERVAL_MS) {
    return { ok: false, rate: window };
  }
  if (window.length >= RATE_MAX_IN_WINDOW) {
    return { ok: false, rate: window };
  }
  window.push(now);
  return { ok: true, rate: window };
}

// ---------------------------------------------------------------------------
// Scoring (SHARED_CONTRACTS: karşılıklı eşleşme önce, sonra açıklanabilir uzlaşı)

export const VOTE_WEIGHT: Record<VoteValue, number> = { strong: 3, like: 1, skip: 0, dislike: 0 };
export const TASTE_BOOST = 2; // DNA özeti örtüşürse o oy iki kat sayılır

function cmpTr(a: string, b: string): number {
  return a.localeCompare(b, 'tr');
}

export function computeResult(
  candidates: Candidate[],
  participants: ParticipantState[],
  now: number,
): RoomResult {
  const voters = participants.filter((p) => Object.keys(p.votes).length > 0);
  const entries: RoomResultEntry[] = candidates.map((c) => {
    let strong = 0, like = 0, skip = 0, dislike = 0, score = 0, boosted = false;
    for (const p of participants) {
      const v = p.votes[c.key];
      if (!v) continue;
      if (v === 'strong') strong++;
      else if (v === 'like') like++;
      else if (v === 'skip') skip++;
      else if (v === 'dislike') dislike++;
      const tasteHit = p.tasteGenres.some((g) => c.genreIds.includes(g));
      if (tasteHit && (v === 'strong' || v === 'like')) boosted = true;
      score += VOTE_WEIGHT[v] * (tasteHit ? TASTE_BOOST : 1);
    }
    const mutual =
      voters.length > 0 && voters.every((p) => {
        const v = p.votes[c.key];
        return v === 'strong' || v === 'like';
      });
    return {
      key: c.key, kind: c.kind, id: c.id, title: c.title, posterPath: c.posterPath,
      year: c.year, strong, like, skip, dislike, score, mutual, vetoed: dislike > 0, boosted,
    };
  });

  const ranking = entries
    .filter((e) => !e.vetoed)
    .sort((a, b) =>
      Number(b.mutual) - Number(a.mutual) || b.score - a.score ||
      b.strong - a.strong || b.like - a.like ||
      candidates.find((c) => c.key === b.key)!.voteAverage -
        candidates.find((c) => c.key === a.key)!.voteAverage ||
      cmpTr(a.title, b.title)
    );

  const top = ranking[0] ?? null;
  const runnerUp = ranking[1] ?? null;
  const tie = !!top && !!runnerUp &&
    top.mutual === runnerUp.mutual && top.score === runnerUp.score &&
    top.strong === runnerUp.strong && top.like === runnerUp.like;

  let reason: RoomResult['reason'];
  if (candidates.length === 0 || voters.length === 0 || !top || top.score <= 0) {
    reason = ranking.length === 0 && candidates.length > 0 ? 'all_vetoed' : 'no_votes';
  } else if (top.mutual) {
    reason = 'match';
  } else if (tie) {
    reason = 'tie';
  } else {
    reason = 'compromise';
  }

  return {
    at: now,
    winner: top && top.score > 0 ? top : null,
    ranking,
    tie,
    reason,
  };
}

// ---------------------------------------------------------------------------
// View assembly (server + memory adapter share this; hostKey ve başkalarının
// oyları asla sızdırılmaz — sonuç fazında dahi yalnızca sayaçlar döner)

export function candidateKeyToDetailPath(kind: MediaType, id: number): string {
  return `/${kind}/${id}`;
}

export function buildView(
  room: RoomDoc,
  participants: ParticipantState[],
  mePid: string,
  now: number,
): RoomView {
  const me = participants.find((p) => p.pid === mePid);
  if (!me) throw new Error('PARTICIPANT_MISSING');
  const phase = room.phase;
  return {
    code: room.code,
    phase,
    constraints: room.constraints,
    candidates: room.candidates,
    participants: participants
      .slice()
      .sort((a, b) => a.joinedAt - b.joinedAt || cmpTr(a.name, b.name))
      .map((p) => ({
        pid: p.pid,
        name: p.name,
        isHost: p.isHost,
        votedCount: phase === 'gathering' ? 0 : Object.keys(p.votes).length,
        tasteAttached: p.tasteGenres.length > 0,
      })),
    me: { pid: me.pid, isHost: me.isHost, myVotes: me.votes, tasteGenres: me.tasteGenres },
    result: phase === 'reveal' ? room.result : null,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    serverNow: now,
  };
}

// ---------------------------------------------------------------------------
// Blob anahtar düzeni (sunucu + bellek adaptörü aynı düzeni kullanır):
//   room/<code>        → RoomDoc
//   part/<code>/<pid>  → ParticipantState
// Katılımcı başına ayrı anahtar: iki istemci aynı anda oy verdiğinde
// kayıp güncelleme olmaz (Blobs'ta atomik yazma kilidi yok).
// Dikkat: iki anahtar birbirinin yol öneki OLMAMALI — `netlify dev` öykünmesi
// blobları dosya sisteminde tutar; `r/CODE` hem dosya hem dizin olamaz.

export function docKey(code: string): string {
  return `room/${code}`;
}

export function partKey(code: string, pid: string): string {
  return `part/${code}/${pid}`;
}

export function partPrefix(code: string): string {
  return `part/${code}/`;
}
