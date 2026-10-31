import { describe, expect, it } from 'vitest';
import { toMediaSummary } from '../../types/mediaSummary';
import type { TrendingRawItem } from '../../types/mediaSummary';

describe('toMediaSummary branching (D5)', () => {
  it('maps movie items from title/poster_path/release_date', () => {
    const movie = {
      id: 550,
      media_type: 'movie',
      title: 'Fight Club',
      poster_path: '/p.jpg',
      backdrop_path: '/b.jpg',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 21000,
      overview: 'A movie',
      popularity: 50.5,
    } satisfies TrendingRawItem;

    const summary = toMediaSummary(movie);
    expect(summary).toMatchObject({
      id: 550,
      media_type: 'movie',
      title: 'Fight Club',
      poster_path: '/p.jpg',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 21000,
    });
    expect(summary.known_for_department).toBeUndefined();
  });

  it('maps tv items from name/first_air_date', () => {
    const tv = {
      id: 1399,
      media_type: 'tv',
      name: 'Game of Thrones',
      poster_path: '/got.jpg',
      first_air_date: '2011-04-17',
    } satisfies TrendingRawItem;

    const summary = toMediaSummary(tv);
    expect(summary.title).toBe('Game of Thrones');
    expect(summary.release_date).toBe('2011-04-17');
    expect(summary.media_type).toBe('tv');
  });

  it('maps person items from name/profile_path/known_for_department', () => {
    const person = {
      id: 287,
      media_type: 'person',
      name: 'Brad Pitt',
      profile_path: '/bp.jpg',
      known_for_department: 'Acting',
    } satisfies TrendingRawItem;

    const summary = toMediaSummary(person);
    expect(summary.title).toBe('Brad Pitt');
    expect(summary.poster_path).toBe('/bp.jpg');
    expect(summary.known_for_department).toBe('Acting');
    expect(summary.release_date).toBeNull();
  });

  it('never throws on sparse items', () => {
    const sparse = { id: 1, media_type: 'movie' } as TrendingRawItem;
    const summary = toMediaSummary(sparse);
    expect(summary.title).toBe('');
    expect(summary.poster_path).toBeNull();
    expect(summary.backdrop_path).toBeNull();
    expect(summary.vote_average).toBeUndefined();
    expect(summary.vote_count).toBeUndefined();
  });
});
