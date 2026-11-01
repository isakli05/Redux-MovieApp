import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildShareText,
  currentStreak,
  loadDays,
  loadSession,
  recordDay,
  saveSession,
  type MysteryDayRecord,
} from '../../lib/mystery/state';
import type { MysteryAnswer } from '../../lib/mystery/types';

const answer: MysteryAnswer = {
  mediaType: 'movie',
  id: 550,
  title: 'Dövüş Kulübü',
  year: 1999,
  posterPath: null,
  creditsLine: 'Yönetmen: David Fincher',
  overview: '',
};

function win(date: string, attempts = 2, points = 80): MysteryDayRecord {
  return { date, won: true, attempts, points, answer };
}

beforeEach(() => {
  localStorage.clear();
});

describe('session persistence', () => {
  it('restores the session for the current puzzle day', () => {
    saveSession({ date: '2026-11-01', guesses: ['Alien', 'Se7en'], status: 'playing' });
    const s = loadSession('2026-11-01');
    expect(s?.guesses).toEqual(['Alien', 'Se7en']);
    expect(s?.status).toBe('playing');
  });

  it('drops the session when the UTC day rolls over', () => {
    saveSession({ date: '2026-11-01', guesses: ['Alien'], status: 'playing' });
    expect(loadSession('2026-11-02')).toBeNull();
  });

  it('survives blocked storage without throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota');
    });
    expect(() => saveSession({ date: '2026-11-01', guesses: [], status: 'playing' })).not.toThrow();
    spy.mockRestore();
  });
});

describe('played days', () => {
  it('records and upserts completed days', () => {
    recordDay({ ...win('2026-11-01'), won: false, points: 0 });
    recordDay(win('2026-11-01')); // replay of a finished day replaces, never doubles
    const days = loadDays();
    expect(Object.keys(days)).toHaveLength(1);
    expect(days['2026-11-01'].won).toBe(true);
    expect(days['2026-11-01'].points).toBe(80);
  });
});

describe('streak logic', () => {
  it('counts consecutive won days ending today', () => {
    const days = {
      '2026-10-30': win('2026-10-30'),
      '2026-10-31': win('2026-10-31'),
      '2026-11-01': win('2026-11-01'),
    };
    expect(currentStreak(days, '2026-11-01')).toBe(3);
  });

  it('banks yesterday’s streak until today is played (or lost)', () => {
    const days = { '2026-10-30': win('2026-10-30'), '2026-10-31': win('2026-10-31') };
    expect(currentStreak(days, '2026-11-01')).toBe(2); // not yet played today
    expect(currentStreak({ ...days, '2026-11-01': { ...win('2026-11-01'), won: false, points: 0 } }, '2026-11-01')).toBe(0);
  });

  it('breaks on a gap or a loss mid-run', () => {
    const days = {
      '2026-10-29': win('2026-10-29'),
      // 2026-10-30 skipped
      '2026-10-31': win('2026-10-31'),
      '2026-11-01': win('2026-11-01'),
    };
    expect(currentStreak(days, '2026-11-01')).toBe(2);
  });
});

describe('share text', () => {
  it('carries the result but never the answer', () => {
    const text = buildShareText({ date: '2026-11-01', won: true, attempts: 3, maxAttempts: 6, streak: 4 });
    expect(text).toContain('01.11.2026');
    expect(text).toContain('3/6');
    expect(text).toContain('4 gün');
    expect(text).not.toContain('Dövüş');
    expect(text).not.toContain('Kulübü');
    const lost = buildShareText({ date: '2026-11-01', won: false, attempts: 6, maxAttempts: 6, streak: 0 });
    expect(lost).toContain('çözemedim');
    expect(lost).not.toContain('Seri');
  });
});
