/**
 * Expansion controller: request batching (single fetch per node), session
 * caching/dedupe, per-node and bulk cancellation.
 */

import { describe, expect, it, vi, type Mock } from 'vitest';
import { createExpansionController, type AbortablePromise } from '../../lib/universe/controller';
import type { RawMovieFull } from '../../lib/universe/expand';

type Deferred = {
  promise: AbortablePromise<RawMovieFull | undefined>;
  resolve: (value: RawMovieFull | undefined) => void;
  reject: (reason?: unknown) => void;
  abort: Mock;
};

function deferredMovie(): Deferred {
  let resolve!: (v: RawMovieFull | undefined) => void;
  let reject!: (r?: unknown) => void;
  const abort = vi.fn();
  const inner = new Promise<RawMovieFull | undefined>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const promise = inner as AbortablePromise<RawMovieFull | undefined>;
  promise.abort = abort;
  return { promise, resolve, reject, abort };
}

describe('expansion controller', () => {
  it('fetches one node exactly once for concurrent expand() calls (dedupe/batching)', async () => {
    const d = deferredMovie();
    const movie = vi.fn(() => d.promise);
    const c = createExpansionController({ movie, tv: vi.fn(), person: vi.fn() });

    const p1 = c.expand({ kind: 'movie', id: 550 });
    const p2 = c.expand({ kind: 'movie', id: 550 });
    expect(movie).toHaveBeenCalledTimes(1);

    d.resolve({ id: 550, title: 'Fight Club' });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1?.nodes[0]?.key).toBe('movie:550');
    expect(r2).toBe(r1);

    // settled → session cache returns null without refetching
    const r3 = await c.expand({ kind: 'movie', id: 550 });
    expect(movie).toHaveBeenCalledTimes(1);
    expect(r3).toBeNull();
  });

  it('aborts the in-flight fetch on cancel() and allows a retry', async () => {
    const d = deferredMovie();
    const movie = vi.fn(() => d.promise);
    const c = createExpansionController({ movie, tv: vi.fn(), person: vi.fn() });

    const p = c.expand({ kind: 'movie', id: 1 });
    c.cancel({ kind: 'movie', id: 1 });
    expect(d.abort).toHaveBeenCalledTimes(1);
    expect(c.inFlightKeys()).toEqual([]);

    d.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expect(p).rejects.toThrow('aborted');

    // retry after cancellation issues a fresh fetch
    const d2 = deferredMovie();
    movie.mockReturnValue(d2.promise);
    const retry = c.expand({ kind: 'movie', id: 1 });
    d2.resolve({ id: 1 });
    expect((await retry)?.nodes[0]?.key).toBe('movie:1');
    expect(movie).toHaveBeenCalledTimes(2);
  });

  it('cancelAll() aborts every in-flight expansion', async () => {
    const d1 = deferredMovie();
    const d2 = deferredMovie();
    const movie = vi.fn().mockReturnValueOnce(d1.promise).mockReturnValueOnce(d2.promise);
    const c = createExpansionController({ movie, tv: vi.fn(), person: vi.fn() });

    c.expand({ kind: 'movie', id: 1 });
    c.expand({ kind: 'movie', id: 2 });
    c.cancelAll();

    expect(d1.abort).toHaveBeenCalledTimes(1);
    expect(d2.abort).toHaveBeenCalledTimes(1);
    expect(c.inFlightKeys()).toEqual([]);
  });

  it('returns null when the fetch resolves without data (e.g. 404)', async () => {
    const d = deferredMovie();
    const c = createExpansionController({ movie: () => d.promise, tv: vi.fn(), person: vi.fn() });
    const p = c.expand({ kind: 'movie', id: 9 });
    d.resolve(undefined);
    expect(await p).toBeNull();
  });
});
