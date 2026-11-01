/**
 * Takip saf matematiği: izlenmiş dizini, sıradaki bölüm (boşluk/yayınlanmamış/
 * özellikler), sezon tamamlanma hesabı.
 */
import { describe, expect, it } from 'vitest';
import type { Interaction } from '../../lib/interactions';
import {
  airedEpisodes,
  buildWatchedIndex,
  followedShows,
  nextUnwatchedEpisode,
  planProgress,
  seasonLabel,
  seasonProgress,
  type EpisodePlan,
} from '../../lib/tracker/progress';
import type { Episode } from '../../types/tvSeasons';

const PAST = '2020-01-01';
const FUTURE = '2030-01-01';

const ep = (n: number, airDate: string | null, runtime = 45): Episode => ({
  air_date: airDate ?? '',
  episode_number: n,
  crew: [],
  guest_stars: [],
  id: n,
  name: `Bölüm ${n}`,
  overview: 'spoiler özet',
  production_code: '',
  season_number: 1,
  still_path: '',
  vote_average: 0,
  vote_count: 0,
  runtime,
});

const watchedEvent = (tvId: number, season: number, episode: number, id = `w-${tvId}-${season}-${episode}`): Interaction => ({
  id,
  kind: 'episode_watched',
  target: { kind: 'tv', id: tvId },
  season,
  episode,
  at: 1,
  source: 'tracker',
});

const none = () => false;

describe('buildWatchedIndex', () => {
  it('indexes episode_watched events per tv/season/episode', () => {
    const idx = buildWatchedIndex([
      watchedEvent(1399, 1, 1),
      watchedEvent(1399, 1, 2),
      watchedEvent(1399, 2, 1),
      watchedEvent(46648, 1, 1),
      { id: 'x', kind: 'like', target: { kind: 'movie', id: 550 }, at: 1, source: 'dna' },
      { id: 'y', kind: 'follow_show', target: { kind: 'tv', id: 1399 }, at: 1, source: 'tracker' },
    ]);
    expect(idx.isWatched(1399, 1, 1)).toBe(true);
    expect(idx.isWatched(1399, 1, 3)).toBe(false);
    expect(idx.isWatched(46648, 1, 1)).toBe(true);
    expect(idx.isWatched(999, 1, 1)).toBe(false);
    expect(idx.episodesFor(1399, 1)).toEqual(new Set([1, 2]));
    expect(idx.seasonNumbers(1399)).toEqual([1, 2]);
  });

  it('keeps the event for undo', () => {
    const e = watchedEvent(1399, 3, 7);
    const idx = buildWatchedIndex([e]);
    expect(idx.eventFor(1399, 3, 7)?.id).toBe(e.id);
    expect(idx.eventFor(1399, 3, 8)).toBeUndefined();
  });
});

describe('followedShows', () => {
  it('maps tvId to the latest follow_show event and ignores others', () => {
    const older: Interaction = { id: 'f1', kind: 'follow_show', target: { kind: 'tv', id: 1399 }, at: 1, source: 'tracker' };
    const newer: Interaction = { id: 'f2', kind: 'follow_show', target: { kind: 'tv', id: 1399 }, at: 5, source: 'tracker' };
    const follows = followedShows([older, newer, watchedEvent(1399, 1, 1)]);
    expect(follows.get(1399)?.id).toBe('f2');
    expect(follows.size).toBe(1);
  });
});

describe('nextUnwatchedEpisode', () => {
  const plan = (seasonNumber: number, episodes: Episode[]): EpisodePlan => ({ seasonNumber, episodes });

  it('returns the first unwatched episode in order', () => {
    const next = nextUnwatchedEpisode([plan(1, [ep(1, PAST), ep(2, PAST)])], (s, e) => s === 1 && e === 1);
    expect(next).toMatchObject({ season: 1, episode: 2, aired: true, airDate: PAST, runtime: 45 });
  });

  it('stops at the gap, not at max watched + 1', () => {
    const isWatched = (s: number, e: number) => s === 1 && (e === 1 || e === 3);
    const next = nextUnwatchedEpisode([plan(1, [ep(1, PAST), ep(2, PAST), ep(3, PAST), ep(4, PAST)])], isWatched);
    expect(next?.episode).toBe(2);
  });

  it('flags an unaired next episode via its air date', () => {
    const next = nextUnwatchedEpisode([plan(1, [ep(1, PAST), ep(2, FUTURE)])], (s, e) => s === 1 && e === 1);
    expect(next).toMatchObject({ episode: 2, aired: false, airDate: FUTURE });
  });

  it('treats a missing air date as not aired', () => {
    const next = nextUnwatchedEpisode([plan(1, [ep(1, null), ep(2, PAST)])], none);
    expect(next).toMatchObject({ episode: 1, aired: false, airDate: null });
  });

  it('never returns season 0 (specials) as next', () => {
    const next = nextUnwatchedEpisode(
      [plan(0, [ep(1, PAST)]), plan(1, [ep(1, PAST)])],
      (s, e) => s === 1 && e === 1,
    );
    expect(next).toBeNull();
  });

  it('scans seasons in order across multiple seasons', () => {
    const next = nextUnwatchedEpisode(
      [plan(2, [ep(1, PAST)]), plan(1, [ep(1, PAST), ep(2, PAST)])],
      (s, e) => s === 1 && e === 1,
    );
    expect(next).toMatchObject({ season: 1, episode: 2 });
  });

  it('returns null when everything watched', () => {
    const next = nextUnwatchedEpisode([plan(1, [ep(1, PAST)])], () => true);
    expect(next).toBeNull();
  });

  it('normalizes missing runtime to null', () => {
    const next = nextUnwatchedEpisode([plan(1, [ep(1, PAST, 0)])], none);
    expect(next?.runtime).toBeNull();
  });
});

describe('season completion math', () => {
  it('computes watched/total and the complete flag', () => {
    expect(seasonProgress(0, 10)).toEqual({ watched: 0, total: 10, complete: false });
    expect(seasonProgress(10, 10)).toEqual({ watched: 10, total: 10, complete: true });
    expect(seasonProgress(0, 0).complete).toBe(false); // boş sezon asla "tamamlanmış" değil
    expect(seasonProgress(12, 10).complete).toBe(true); // taşan kayıt toleransı
  });

  it('planProgress counts watched episodes of the plan', () => {
    const episodes = [ep(1, PAST), ep(2, PAST), ep(3, FUTURE)];
    const idx = buildWatchedIndex([watchedEvent(1399, 1, 1), watchedEvent(1399, 1, 2)]);
    expect(planProgress({ seasonNumber: 1, episodes }, idx, 1399)).toEqual({
      watched: 2,
      total: 3,
      complete: false,
    });
  });

  it('airedEpisodes drops unaired episodes', () => {
    const episodes = [ep(1, PAST), ep(2, FUTURE), ep(3, null)];
    expect(airedEpisodes(episodes).map((e) => e.episode_number)).toEqual([1]);
  });
});

describe('seasonLabel', () => {
  it('labels season 0 as Özellikler and numbered seasons separately', () => {
    expect(seasonLabel(0)).toBe('Özellikler');
    expect(seasonLabel(1)).toBe('1. Sezon');
  });
});
