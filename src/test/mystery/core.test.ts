import { describe, expect, it } from 'vitest';
import {
  SEED_POOL,
  candidateOrder,
  mysteryDateKey,
  parseDateKey,
  pickDaily,
  shiftDateKey,
  shuffledPool,
} from '../../lib/mystery/core';

describe('daily selection determinism', () => {
  it('picks the identical entry for a date on every call', () => {
    const a = pickDaily('2026-11-01');
    const b = pickDaily('2026-11-01');
    expect(a).toEqual(b);
    expect(shuffledPool('2026-11-01')).toEqual(shuffledPool('2026-11-01'));
  });

  it('ships a large, clean seed pool', () => {
    expect(SEED_POOL.length).toBeGreaterThanOrEqual(150);
    const keys = new Set(SEED_POOL.map((e) => `${e.kind}:${e.id}`));
    expect(keys.size).toBe(SEED_POOL.length); // no duplicates
    for (const e of SEED_POOL) {
      expect(['movie', 'tv']).toContain(e.kind);
      expect(e.id).toBeGreaterThan(0);
    }
  });

  it('covers consecutive days with (near-)distinct titles', () => {
    const picks = new Set<string>();
    let cursor = '2026-01-01';
    for (let i = 0; i < 40; i++) {
      const p = pickDaily(cursor);
      picks.add(`${p.kind}:${p.id}`);
      cursor = shiftDateKey(cursor, 1);
    }
    // With a 150+ pool, 40 days must surface at least 34 distinct titles.
    expect(picks.size).toBeGreaterThanOrEqual(34);
  });

  it('derives the puzzle day from UTC, not the viewer timezone', () => {
    expect(mysteryDateKey(new Date('2026-11-01T23:59:59.999Z'))).toBe('2026-11-01');
    expect(mysteryDateKey(new Date('2026-11-02T00:00:00.001Z'))).toBe('2026-11-02');
    // Same instant expressed in +03:00 and -08:00 → same UTC day.
    expect(mysteryDateKey(new Date('2026-11-01T20:30:00-04:00'))).toBe('2026-11-02');
  });

  it('rolls over deterministically at the UTC day boundary', () => {
    const before = pickDaily('2026-11-01');
    const after = pickDaily('2026-11-02');
    // Not necessarily different titles — but both are stable and valid picks.
    expect(candidateOrder('2026-11-02')).toContain(after);
    expect(candidateOrder('2026-11-01')[0]).toEqual(before);
  });

  it('shifts and parses date keys on the UTC calendar', () => {
    expect(shiftDateKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDateKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDateKey('2024-03-01', -1)).toBe('2024-02-29'); // leap year
    expect(parseDateKey('2026-11-01')).toBe(Date.parse('2026-11-01T00:00:00Z'));
    expect(parseDateKey('2026-11-1')).toBeNull();
    expect(parseDateKey('not-a-date')).toBeNull();
  });
});
