/**
 * Cinema Universe — expansion controller.
 *
 * One BFF request per node (append_to_response bundles credits + recommendations
 * + collection), de-duplicated per session, cancellable per node. Fetchers are
 * injected so tests can verify caching/cancellation without network or React.
 */

import { mediaKey, type MediaRef } from '../mediaRef';
import {
  buildMovieExpansion,
  buildPersonExpansion,
  buildTvExpansion,
  type Expansion,
  type RawMovieFull,
  type RawPersonFull,
  type RawTvFull,
} from './expand';

/** Promise with RTK Query-style `abort()` attached. */
export interface AbortablePromise<T> extends Promise<T> {
  abort?: () => void;
}

export interface ExpansionFetchers {
  movie(id: number): AbortablePromise<RawMovieFull | undefined>;
  tv(id: number): AbortablePromise<RawTvFull | undefined>;
  person(id: number): AbortablePromise<RawPersonFull | undefined>;
}

/** Maps the raw payload for the ref's kind to graph elements. */
function buildX(ref: MediaRef, data: unknown): Expansion {
  if (ref.kind === 'movie') return buildMovieExpansion(data as RawMovieFull);
  if (ref.kind === 'tv') return buildTvExpansion(data as RawTvFull);
  return buildPersonExpansion(data as RawPersonFull);
}

interface InFlight {
  promise: Promise<Expansion | null>;
  abort: () => void;
}

export interface ExpansionController {
  /** Fetches + maps neighbors for a ref. Concurrent/repeat calls dedupe. */
  expand(ref: MediaRef): Promise<Expansion | null>;
  /** Aborts and forgets the in-flight fetch for one key (no-op if settled). */
  cancel(ref: Pick<MediaRef, 'kind' | 'id'>): void;
  /** Aborts everything in flight. */
  cancelAll(): void;
  inFlightKeys(): string[];
}

export function createExpansionController(fetchers: ExpansionFetchers): ExpansionController {
  const cache = new Map<string, InFlight>();
  const settled = new Set<string>();

  const build = (ref: MediaRef): AbortablePromise<Expansion | null> => {
    const base =
      ref.kind === 'movie'
        ? fetchers.movie(ref.id)
        : ref.kind === 'tv'
          ? fetchers.tv(ref.id)
          : fetchers.person(ref.id);
    const out = base.then((d) => (d ? buildX(ref, d) : null)) as AbortablePromise<Expansion | null>;
    out.abort = () => base.abort?.();
    return out;
  };

  return {
    expand(ref: MediaRef) {
      const key = mediaKey(ref);
      if (settled.has(key)) return Promise.resolve(null); // already fetched this session
      const existing = cache.get(key);
      if (existing) return existing.promise;
      const request = build(ref);
      const entry: InFlight = {
        promise: request,
        abort: () => {
          request.abort?.();
          cache.delete(key);
        },
      };
      cache.set(key, entry);
      request
        .then(() => settled.add(key))
        .catch(() => cache.delete(key)) // failed/cancelled → retryable
        .catch(() => undefined);
      return entry.promise;
    },
    cancel(ref) {
      cache.get(mediaKey(ref))?.abort();
    },
    cancelAll() {
      for (const entry of cache.values()) entry.abort();
      cache.clear();
    },
    inFlightKeys() {
      return [...cache.keys()];
    },
  };
}
