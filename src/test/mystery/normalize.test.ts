import { describe, expect, it } from 'vitest';
import { normalizeAnswers, normalizeTitle, titlesMatch } from '../../lib/mystery/normalize';

describe('guess normalization', () => {
  it('folds case, diacritics, punctuation and padding', () => {
    expect(normalizeTitle('  Dövüş Kulübü ')).toBe(normalizeTitle('dovus kulubu'));
    expect(normalizeTitle('DÖVÜŞ KULÜBÜ')).toBe(normalizeTitle('dövüş kulübü'));
    expect(normalizeTitle('Mission: Impossible')).toBe(normalizeTitle('mission impossible'));
    expect(normalizeTitle('Spider-Man')).toBe(normalizeTitle('spider man'));
    expect(normalizeTitle('Se7en')).toBe('se7en');
  });

  it('strips a leading article so "The Matrix" matches "Matrix"', () => {
    expect(normalizeTitle('The Matrix')).toBe(normalizeTitle('matrix'));
    expect(normalizeTitle('Bir Zamanlar Anadolu’da')).toBe(normalizeTitle('zamanlar anadolu da'));
  });

  it('matches a guess against the title and its alias set, deduplicated', () => {
    const answers = ['Dövüş Kulübü', 'Fight Club', 'Fight Club', ''];
    expect(titlesMatch('fight club', answers)).toBe(true);
    expect(titlesMatch('FIGHT CLUB', answers)).toBe(true);
    expect(titlesMatch('dövüş kulübü', answers)).toBe(true);
    expect(titlesMatch('dovus kulubu', answers)).toBe(true);
    expect(normalizeAnswers(answers)).toHaveLength(2); // title + en alias, empties dropped
  });

  it('accepts localized TMDB aliases as correct', () => {
    expect(titlesMatch('Yedi', ['Se7en', 'Yedi'])).toBe(true);
    expect(titlesMatch('Yıldız Savaşları', ['Star Wars', 'Yıldız Savaşları'])).toBe(true);
  });

  it('rejects near-misses, noise and empty input', () => {
    expect(titlesMatch('Alien', ['Aliens'])).toBe(false); // plural is a different film
    expect(titlesMatch('Aliens', ['Alien'])).toBe(false);
    expect(titlesMatch('a', ['A.I. Yapay Zeka'])).toBe(false);
    expect(titlesMatch('', ['Fight Club'])).toBe(false);
    expect(titlesMatch('   ', ['Fight Club'])).toBe(false);
    expect(titlesMatch('küpe', ['Küplük'])).toBe(false);
  });

  it('does not match an unrelated film sharing one word', () => {
    expect(titlesMatch('Ring', ['The Lord of the Rings: The Fellowship of the Ring'])).toBe(false);
  });
});
