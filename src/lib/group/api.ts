/**
 * Birlikte İzle — istemci API katmanı.
 *
 * Production implementation: Netlify BFF (/api/rooms*) üzerinden HTTP.
 * Tests use the in-memory adapter (memoryApi.ts) behind the SAME interface.
 * Tüm hatalar GroupApiError olarak yükselir (sanitize edilmiş kod + mesaj).
 */

import type {
  Candidate,
  MediaType,
  Phase,
  RoomConstraints,
  RoomResult,
  RoomResultEntry,
  RoomView,
  VoteValue,
} from './core';

export interface CreateResult {
  code: string;
  pid: string;
  hostKey: string;
  view: RoomView;
}

export interface JoinResult {
  pid: string;
  view: RoomView;
}

export interface ProviderOption {
  id: number;
  name: string;
}

export interface GroupApi {
  createRoom(input: { name?: string; constraints?: unknown }): Promise<CreateResult>;
  joinRoom(code: string, name: string, tasteGenres?: number[]): Promise<JoinResult>;
  getRoom(code: string, pid: string): Promise<RoomView>;
  setConstraints(code: string, hostKey: string, pid: string, constraints: RoomConstraints): Promise<RoomView>;
  generateCandidates(code: string, hostKey: string, pid: string, seed?: number): Promise<RoomView>;
  setPhase(code: string, hostKey: string, pid: string, phase: 'voting' | 'reveal'): Promise<RoomView>;
  vote(code: string, pid: string, key: string, value: VoteValue): Promise<RoomView>;
  attachTaste(code: string, pid: string, genres: number[]): Promise<RoomView>;
  providers(mediaType: MediaType, region: string): Promise<ProviderOption[]>;
}

export class GroupApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GroupApiError';
  }
}

type FetchLike = typeof fetch;

function extractError(status: number, body: unknown): GroupApiError {
  const err = (body as { error?: { code?: string; message?: string } })?.error;
  return new GroupApiError(
    status,
    err?.code ?? 'unknown',
    err?.message ?? 'Beklenmeyen bir hata oluştu.',
  );
}

/** HTTP üzerinden GroupApi (üretim). */
export function createHttpApi(fetchFn: FetchLike = fetch): GroupApi {
  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetchFn(`/api${path}`, {
        headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
        ...init,
      });
    } catch {
      throw new GroupApiError(0, 'network', 'Bağlantı kurulamadı; internetini kontrol et.');
    }
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* boş gövde */
    }
    if (!res.ok) throw extractError(res.status, body);
    return body as T;
  }

  const post = <T>(path: string, payload: Record<string, unknown>): Promise<T> =>
    call<T>(path, { method: 'POST', body: JSON.stringify(payload) });

  return {
    createRoom: (input) => post('/rooms', input),
    joinRoom: (code, name, tasteGenres) =>
      post('/rooms/join', { code, name, ...(tasteGenres?.length ? { tasteGenres } : {}) }),
    getRoom: (code, pid) =>
      call<RoomView>(`/rooms?code=${encodeURIComponent(code)}&pid=${encodeURIComponent(pid)}`),
    setConstraints: (code, hostKey, pid, constraints) =>
      post('/rooms/manage', { code, hostKey, pid, action: 'constraints', constraints }),
    generateCandidates: (code, hostKey, pid, seed) =>
      post('/rooms/manage', { code, hostKey, pid, action: 'candidates', ...(seed ? { seed } : {}) }),
    setPhase: (code, hostKey, pid, phase) =>
      post('/rooms/manage', { code, hostKey, pid, action: 'phase', phase }),
    vote: (code, pid, key, value) => post('/rooms/vote', { code, pid, vote: { key, value } }),
    attachTaste: (code, pid, genres) => post('/rooms/vote', { code, pid, tasteGenres: genres }),
    providers: async (mediaType, region) => {
      const r = await call<{ providers: ProviderOption[] }>(
        `/rooms/providers?mediaType=${mediaType}&region=${encodeURIComponent(region)}`,
      );
      return r.providers ?? [];
    },
  };
}

// Re-export commonly used types for UI components.
export type {
  Candidate,
  MediaType,
  Phase,
  RoomConstraints,
  RoomResult,
  RoomResultEntry,
  RoomView,
  VoteValue,
};
