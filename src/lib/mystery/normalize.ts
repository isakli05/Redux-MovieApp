/**
 * Guess normalization + alias matching for the daily mystery.
 *
 * Server-side truth (the browser never sees the answer set): a guess is
 * correct when its normalized form equals the normalized form of the title,
 * its original title, or any TMDB alternative title.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Leading articles stripped from both sides of a comparison (language-fair). */
const LEADING_ARTICLES = /^(the|a|an|la|le|les|el|los|las|il|der|die|das|bir)\s+/;

/** Case/diacritic/punctuation-insensitive comparison form. */
export function normalizeTitle(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(LEADING_ARTICLES, '')
    .trim();
}

/** All non-empty normalized variants of a set of raw titles. */
export function normalizeAnswers(answers: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const raw of answers) {
    if (typeof raw !== 'string') continue;
    const n = normalizeTitle(raw);
    if (n.length >= 2) seen.add(n);
  }
  return [...seen];
}

/**
 * Does `guess` match any accepted answer? One-letter/empty noise never matches
 * ("a" must not hit a title that normalizes to "a").
 */
export function titlesMatch(guess: string, answers: readonly string[]): boolean {
  const g = normalizeTitle(guess);
  if (g.length < 2) return false;
  return normalizeAnswers(answers).includes(g);
}
