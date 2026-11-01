/**
 * Günlük Bilmece — deterministic daily selection (SHARED_CONTRACTS §E).
 *
 * Pure logic shared by the BFF functions (`netlify/functions/daily-mystery*.ts`)
 * and the test suite: every user must get the SAME title for a given UTC day,
 * forever, without any stored state.
 *
 * The puzzle day resets at 00:00 UTC (shown in the UI); `mysteryDateKey` is the
 * single source of truth for "which day is it".
 */

export type MysteryKind = 'movie' | 'tv';

export interface SeedEntry {
  kind: MysteryKind;
  id: number;
}

/**
 * Curated seed pool of well-known TMDB titles (~175 ids). The daily picker
 * shuffles this pool with a date-keyed PRNG, so the pool only needs to be
 * stable — never reordered after launch, or past days silently change.
 */
const MOVIE_IDS: readonly number[] = [
  278, 13, 550, 680, 27205, 155, 475557, 603, 11, 1726, 24428, 299534, 299536, 78, 335984, 12,
  862, 10193, 500, 769, 238, 240, 424, 8587, 920, 157336, 11216, 346, 539, 562, 120, 121, 122,
  438631, 693134, 496243, 545611, 634649, 447365, 118340, 68721, 10138, 62, 1891, 1892, 280, 871,
  414906, 530915, 98, 604, 605, 671, 329, 111, 142, 1771, 44214, 11324, 76341, 105, 348, 679,
  399566, 823464, 807, 857, 197, 597, 19995, 106, 772, 101, 949, 115, 275, 629, 180, 14, 77, 141,
  670, 24, 808, 585, 9806, 10681, 14160, 2062, 150540, 354912, 109445, 269149, 812, 129, 372058,
  286217, 329865, 313369, 419430, 374720, 515001, 546554, 577922, 872585, 346698, 361743, 68718,
  16869, 466272, 244786, 120467, 245891, 293660, 263115, 297762, 297802, 284054, 284053, 284052,
  299537, 315635, 335983, 272, 49026, 106646, 99861, 271110, 283995, 165, 578, 694, 185, 64, 1124,
  268,
];

const TV_IDS: readonly number[] = [
  1399, 1396, 66732, 456, 1668, 2316, 60625, 94605, 71912, 60059, 63174, 60574, 46648, 82856,
  84958, 119051, 19885, 76479, 85271, 1402, 70523, 71446, 93405, 95396, 100088, 87108, 42009,
  63351, 69740, 63247, 44217, 1429, 13916, 37854, 30983, 1100, 1418, 1421, 1416, 1405, 94997,
  136315, 97546, 126308,
];

export const SEED_POOL: readonly SeedEntry[] = [
  ...MOVIE_IDS.map((id) => ({ kind: 'movie' as const, id })),
  ...TV_IDS.map((id) => ({ kind: 'tv' as const, id })),
];

/** Bump ONLY to retire the pool (changes every past day) — never casually. */
const SALT = 'lmdb-mystery-v1';

/** UTC puzzle day as `YYYY-MM-DD` (the game resets at 00:00 UTC). */
export function mysteryDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Shift a date key by whole days, staying on the UTC calendar. */
export function shiftDateKey(key: string, days: number): string {
  const base = Date.parse(`${key}T00:00:00Z`);
  if (Number.isNaN(base)) return key;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` key into UTC epoch ms; null when malformed. */
export function parseDateKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const t = Date.parse(`${key}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** FNV-1a 32-bit — small, stable, dependency-free string hash. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic 32-bit PRNG (fixed shuffle source). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates over the seed pool, seeded by SALT + date key. */
export function shuffledPool(dateKey: string): readonly SeedEntry[] {
  const rng = mulberry32(fnv1a(`${SALT}:${dateKey}`));
  const pool = [...SEED_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Candidate order for a day: the shuffled pool itself. The first entry is
 * today's pick; later entries are deterministic fallbacks when a TMDB fetch
 * fails (retired id, region block), so a bad pool entry can never break a day.
 */
export function candidateOrder(dateKey: string): readonly SeedEntry[] {
  return shuffledPool(dateKey);
}

/** Today's (or any day's) deterministic seed entry. */
export function pickDaily(dateKey: string): SeedEntry {
  return candidateOrder(dateKey)[0];
}
