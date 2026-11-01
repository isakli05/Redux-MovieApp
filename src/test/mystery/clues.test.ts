import { describe, expect, it } from 'vitest';
import {
  answerSet,
  buildClueLadder,
  leaksAnswer,
  toAnswerPayload,
  type MysterySource,
} from '../../lib/mystery/clues';

const fightClub: MysterySource = {
  mediaType: 'movie',
  id: 550,
  title: 'Dövüş Kulübü',
  originalTitle: 'Fight Club',
  releaseYear: 1999,
  genres: ['Dram', 'Gerilim'],
  runtimeMinutes: 139,
  directors: ['David Fincher'],
  cast: ['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter', 'Meat Loaf'],
  keywords: ['fight club', 'anarchy', 'insomnia', 'split personality', 'nihilism'],
  aliases: ['Fight Club', 'Dövüş Kulübü'],
  posterPath: '/p.jpg',
  overview: 'Uykusuzluk çeken bir adam...',
};

describe('clue ladder', () => {
  it('builds a progressively easier ladder from factual metadata', () => {
    const clues = buildClueLadder(fightClub);
    expect(clues.map((c) => c.id)).toEqual(['era-genre', 'initials', 'keywords', 'cast', 'year-format']);
    expect(clues[0].text).toContain("1990'lar");
    expect(clues[0].text).toContain('Dram');
    expect(clues[1].text).toContain('D. F.');
    expect(clues[2].text).toContain('anarchy');
    expect(clues[3].text).toContain('Brad Pitt');
    expect(clues[4].text).toContain('1999');
    expect(clues[4].text).toContain('139 dakika');
  });

  it('NEVER contains the answer in any clue (answer-absence)', () => {
    for (const source of [
      fightClub,
      { ...fightClub, title: 'Star Wars', originalTitle: undefined, aliases: ['Yıldız Savaşları'] },
    ]) {
      const payload = JSON.stringify(buildClueLadder(source));
      for (const answer of answerSet(source)) {
        const probes = [answer, normalize(answer)];
        for (const probe of probes) {
          // Whole answer, case variants and the folded form must be absent.
          if (probe.replace(/\s+/g, '').length >= 4) {
            expect(payload).not.toContain(probe);
            expect(payload.toLowerCase()).not.toContain(probe.toLowerCase());
          }
        }
      }
    }
  });

  it('scrubs metadata items that share a word with the answer', () => {
    const withLeakyKeyword = {
      ...fightClub,
      title: 'Alien',
      originalTitle: 'Alien',
      aliases: [],
      keywords: ['alien', 'space horror', 'xenomorph', 'spaceship', 'nostromo'],
    };
    const clues = buildClueLadder(withLeakyKeyword);
    const keywordsClue = clues.find((c) => c.id === 'keywords');
    expect(keywordsClue?.text).toContain('xenomorph');
    expect(keywordsClue?.text).not.toContain('alien');
  });

  it('drops clues entirely when nothing safe remains', () => {
    const leakyCast = { ...fightClub, cast: ['Dövüş Kulübü'], keywords: [] };
    const clues = buildClueLadder(leakyCast);
    expect(clues.find((c) => c.id === 'cast')).toBeUndefined();
    expect(clues.find((c) => c.id === 'keywords')).toBeUndefined();
  });
});

describe('leaksAnswer', () => {
  it('detects substring and word-level leaks', () => {
    expect(leaksAnswer('star wars universe', ['Star Wars'])).toBe(true);
    expect(leaksAnswer('the alien saga', ['Alien'])).toBe(true);
    expect(leaksAnswer('space horror', ['Star Wars'])).toBe(false);
    expect(leaksAnswer('ripley', ['Alien'])).toBe(false);
    expect(leaksAnswer('', ['Alien'])).toBe(false);
  });
});

describe('reveal payload', () => {
  it('carries the answer only in the dedicated payload shape', () => {
    const answer = toAnswerPayload(fightClub);
    expect(answer).toEqual({
      mediaType: 'movie',
      id: 550,
      title: 'Dövüş Kulübü',
      year: 1999,
      posterPath: '/p.jpg',
      creditsLine: 'Yönetmen: David Fincher',
      overview: 'Uykusuzluk çeken bir adam...',
    });
    expect(toAnswerPayload({ ...fightClub, mediaType: 'tv', posterPath: undefined }).creditsLine).toBe(
      'Yaratıcı: David Fincher',
    );
  });
});

/** Local copy of the fold used client-side for probe variants. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
