import { describe, expect, it } from 'vitest';
import { mapTrendingAllResponse, trendingAllUrl } from '../endpoints/movies.endpoints';
import type { TrendingAllRawResponse } from '../endpoints/movies.endpoints';
import { TMDB_CONFIG } from '../../utils/constants';

describe('getTrendingMixed (D5, fixes E/G)', () => {
  it('builds the /trending/all/{tw} URL with page (trendingAllUrl is the endpoint query fn)', () => {
    expect(trendingAllUrl({ timeWindow: 'week', page: 3 })).toBe(
      `/trending/all/week?language=${TMDB_CONFIG.LANGUAGE}&page=3`,
    );
    expect(trendingAllUrl({ timeWindow: 'day' })).toBe(
      `/trending/all/day?language=${TMDB_CONFIG.LANGUAGE}&page=1`,
    );
  });

  it('normalizes mixed movie/tv/person results via toMediaSummary', () => {
    const raw: TrendingAllRawResponse = {
      page: 1,
      total_pages: 5,
      total_results: 3,
      results: [
        {
          id: 550,
          media_type: 'movie',
          title: 'Fight Club',
          poster_path: '/p.jpg',
          release_date: '1999-10-15',
        },
        {
          id: 1399,
          media_type: 'tv',
          name: 'Game of Thrones',
          poster_path: '/got.jpg',
          first_air_date: '2011-04-17',
        },
        {
          id: 287,
          media_type: 'person',
          name: 'Brad Pitt',
          profile_path: '/bp.jpg',
          known_for_department: 'Acting',
        },
      ],
    };

    const page = mapTrendingAllResponse(raw);
    expect(page.page).toBe(1);
    expect(page.total_pages).toBe(5);
    expect(page.results).toHaveLength(3);
    expect(page.results[0]).toMatchObject({ media_type: 'movie', title: 'Fight Club' });
    expect(page.results[1]).toMatchObject({ media_type: 'tv', title: 'Game of Thrones', release_date: '2011-04-17' });
    expect(page.results[2]).toMatchObject({ media_type: 'person', title: 'Brad Pitt', poster_path: '/bp.jpg' });
  });

  it('degrades to an empty results array on missing results', () => {
    const page = mapTrendingAllResponse({
      page: 2,
      results: undefined as unknown as TrendingAllRawResponse['results'],
      total_pages: 0,
      total_results: 0,
    });
    expect(page.results).toEqual([]);
    expect(page.page).toBe(2);
  });
});
