/**
 * BFF handler tests: answer-absence at the HTTP boundary and server-side
 * guess validation (aliases, reveal-on-completion, rate limit).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dailyMystery from '../../../netlify/functions/daily-mystery';
import dailyMysteryGuess from '../../../netlify/functions/daily-mystery-guess';
import { mysteryDateKey } from '../../lib/mystery/core';

/** TMDB detail shape for the (deterministically picked) daily candidate. */
const TMDB_DETAIL = {
  id: 550,
  title: 'Dövüş Kulübü',
  original_title: 'Fight Club',
  release_date: '1999-10-15',
  runtime: 139,
  overview: 'Uykusuzluk çeken bir adam...',
  poster_path: '/p.jpg',
  genres: [{ id: 18, name: 'Dram' }, { id: 53, name: 'Gerilim' }],
  credits: {
    cast: [{ name: 'Brad Pitt' }, { name: 'Edward Norton' }, { name: 'Helena Bonham Carter' }],
    crew: [{ name: 'David Fincher', job: 'Director' }],
  },
  keywords: {
    keywords: [
      { id: 1, name: 'anarchy' },
      { id: 2, name: 'insomnia' },
      { id: 3, name: 'nihilism' },
      { id: 4, name: 'split personality' },
      { id: 5, name: 'fight club' },
    ],
  },
  alternative_titles: {
    titles: [{ iso_3166_1: 'US', title: 'Fight Club' }, { iso_3166_1: 'TR', title: 'Dövüş Kulübü' }],
  },
};

beforeEach(() => {
  process.env.TMDB_API_KEY = 'test-key';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(TMDB_DETAIL), { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TMDB_API_KEY;
});

function guessRequest(body: unknown, participant = 'p1'): Request {
  return new Request('https://lmdb.test/api/daily-mystery/guess', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', 'x-lmdb-participant': participant },
    body: JSON.stringify(body),
  });
}

describe('GET /api/daily-mystery', () => {
  it('returns a clue ladder whose payload contains no answer string', async () => {
    const res = await dailyMystery(new Request('https://lmdb.test/api/daily-mystery'));
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { date: string; clues: { id: string; text: string }[] };

    expect(payload.date).toBe(mysteryDateKey(new Date()));
    expect(payload.clues.length).toBeGreaterThanOrEqual(3);
    // The leaky keyword must have been scrubbed…
    expect(payload.clues.find((c) => c.id === 'keywords')?.text).not.toContain('fight club');
    // …and no answer form may appear anywhere in the client payload.
    const serialized = JSON.stringify(payload).toLowerCase();
    expect(serialized).not.toContain('dövüş');
    expect(serialized).not.toContain('dovus');
    expect(serialized).not.toContain('fight');
    expect(serialized).not.toContain('kulübü');
  });

  it('rejects non-GET methods', async () => {
    const res = await dailyMystery(new Request('https://lmdb.test/api/daily-mystery', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});

describe('POST /api/daily-mystery/guess', () => {
  it('validates guesses against the title + alias set server-side', async () => {
    const wrong = await dailyMysteryGuess(guessRequest({ guess: 'pulp fiction', attempt: 1, final: false }));
    const wrongBody = (await wrong.json()) as { correct: boolean; answer?: unknown };
    expect(wrongBody.correct).toBe(false);
    expect(wrongBody.answer).toBeUndefined(); // no reveal mid-game

    for (const [guess, label] of [
      ['Fight Club', 'original title'],
      ['DÖVÜŞ KULÜBÜ', 'localized title'],
      ['dovus kulubu', 'diacritic-folded'],
    ] as const) {
      const res = await dailyMysteryGuess(guessRequest({ guess, attempt: 1, final: false }));
      const body = (await res.json()) as { correct: boolean; answer: { title: string } };
      expect(body.correct, label).toBe(true);
      expect(body.answer.title).toBe('Dövüş Kulübü'); // reveal travels only with completion
    }
  });

  it('reveals on the final wrong guess but not before', async () => {
    const notFinal = await dailyMysteryGuess(guessRequest({ guess: 'alien', attempt: 5, final: false }));
    expect(((await notFinal.json()) as { answer?: unknown }).answer).toBeUndefined();

    const final = await dailyMysteryGuess(guessRequest({ guess: 'alien', attempt: 6, final: true }));
    const body = (await final.json()) as { correct: boolean; answer: { title: string; creditsLine: string } };
    expect(body.correct).toBe(false);
    expect(body.answer.creditsLine).toBe('Yönetmen: David Fincher');
  });

  it('requires the CSRF mutation header and a sane body', async () => {
    const noHeader = new Request('https://lmdb.test/api/daily-mystery/guess', {
      method: 'POST',
      body: JSON.stringify({ guess: 'x' }),
    });
    expect((await dailyMysteryGuess(noHeader)).status).toBe(403);

    const empty = await dailyMysteryGuess(guessRequest({ guess: '   ' }));
    expect(empty.status).toBe(400);
  });

  it('rate-limits a participant after the daily allowance', async () => {
    for (let i = 0; i < 12; i++) {
      const res = await dailyMysteryGuess(guessRequest({ guess: `guess ${i}`, attempt: 1, final: false }, 'rl-test'));
      expect(res.status).toBe(200);
    }
    const blocked = await dailyMysteryGuess(guessRequest({ guess: 'one more', attempt: 1, final: false }, 'rl-test'));
    expect(blocked.status).toBe(429);
    // Other participants are unaffected.
    expect((await dailyMysteryGuess(guessRequest({ guess: 'Fight Club', attempt: 1, final: false }, 'rl-other'))).status).toBe(200);
  });
});
