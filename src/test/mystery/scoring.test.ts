import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, pointsForWin, revealedClueCount } from '../../lib/mystery/scoring';

describe('scoring', () => {
  it('rewards fewer attempts with more points, monotonically', () => {
    let previous = Infinity;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const points = pointsForWin(attempt);
      expect(points).toBeGreaterThan(0);
      expect(points).toBeLessThan(previous); // strictly easier ⇒ strictly fewer points
      previous = points;
    }
    expect(pointsForWin(1)).toBe(100);
    expect(pointsForWin(MAX_ATTEMPTS)).toBe(15);
  });

  it('is fair across the whole attempt range (clamps out-of-range input)', () => {
    expect(pointsForWin(0)).toBe(pointsForWin(1));
    expect(pointsForWin(99)).toBe(pointsForWin(MAX_ATTEMPTS));
    expect(pointsForWin(2.9)).toBe(pointsForWin(2));
  });

  it('opens one clue per wrong guess, starting from the free first clue', () => {
    expect(revealedClueCount(0, 5)).toBe(1);
    expect(revealedClueCount(1, 5)).toBe(2);
    expect(revealedClueCount(4, 5)).toBe(5);
    expect(revealedClueCount(5, 6)).toBe(6);
    expect(revealedClueCount(9, 5)).toBe(5); // capped by ladder length
    expect(revealedClueCount(-3, 5)).toBe(1);
    expect(revealedClueCount(2, 0)).toBe(1); // degenerate ladder never shows zero clues
  });
});
