/**
 * Seans veri sınırı — URL kurucular, normalizasyon ve fetch sarmalayıcıları.
 * Global fetch mock'lanır; TMDB_CONFIG test ortamında BASE_URL='/api/tmdb',
 * LANGUAGE='tr-TR' ve PROD=false'dır (withApiKey bu yüzden no-op).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TMDB_CONFIG } from '@utils/constants';
import {
  SeansApiError,
  discoverUrl,
  fetchCandidatePool,
  normalizeDiscoverPage,
  tmdbFetch,
  withApiKey,
} from '../../lib/seans/api';
import type { SeansAnswers } from '../../lib/seans/types';

const answers = (p: Partial<SeansAnswers> = {}): SeansAnswers => ({
  kind: 'movie',
  mood: null,
  runtime: 'any',
  genres: [],
  familiarity: null,
  providers: [],
  region: 'TR',
  seed: null,
  ...p,
});

/** jsdom'da Response yoksa düz nesne ile aynı sözleşmeyi verir. */
function jsonResponse(body: unknown, status = 200): Response {
  if (typeof Response !== 'undefined') {
    return new Response(JSON.stringify(body), { status });
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const paramsOf = (url: string): URLSearchParams => new URL(url, 'https://tmdb.test').searchParams;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('discoverUrl', () => {
  it('film: türler, süre penceresi, mood tabanı, keşif kalitesi, servis filtresi tek URLde', () => {
    const url = discoverUrl(
      answers({
        kind: 'movie',
        mood: 'thrill',
        runtime: 'medium',
        genres: [35, 28],
        familiarity: 'adventurous',
        providers: [8, 119],
        region: 'TR',
      }),
      2,
    );
    expect(url.startsWith('/discover/movie?')).toBe(true);
    const q = paramsOf(url);
    expect(q.get('with_genres')).toBe('35|28');
    expect(q.get('with_runtime.gte')).toBe('90');
    expect(q.get('with_runtime.lte')).toBe('120');
    expect(q.get('vote_average.gte')).toBe('6.3');
    expect(q.get('vote_count.gte')).toBe('80');
    expect(q.get('sort_by')).toBe('vote_average.desc');
    expect(q.get('watch_region')).toBe('TR');
    expect(q.get('with_watch_providers')).toBe('8|119');
    expect(q.get('include_adult')).toBe('false');
    expect(q.get('language')).toBe(TMDB_CONFIG.LANGUAGE);
    expect(q.get('page')).toBe('2');
    expect(q.get('without_genres')).toBeNull();
  });

  it('dizi: bölüm süresi ölçeği, haber/talk/reality hariç, bilinen sular tabanı', () => {
    const url = discoverUrl(
      answers({
        kind: 'tv',
        mood: 'laugh',
        runtime: 'short',
        genres: [],
        familiarity: 'familiar',
        providers: [],
      }),
      1,
    );
    expect(url.startsWith('/discover/tv?')).toBe(true);
    const q = paramsOf(url);
    expect(q.get('with_runtime.lte')).toBe('30');
    expect(q.get('with_runtime.gte')).toBeNull();
    expect(q.get('without_genres')).toBe('10763,10767,10764');
    expect(q.get('vote_average.gte')).toBe('6');
    expect(q.get('vote_count.gte')).toBe('150');
    expect(q.get('sort_by')).toBe('popularity.desc');
    expect(q.get('watch_region')).toBeNull();
    expect(q.get('with_watch_providers')).toBeNull();
    expect(q.get('page')).toBe('1');
  });

  it("süre 'any' iken runtime parametresi hiç yoktur; familiarity yoksa varsayılan taban", () => {
    const q = paramsOf(discoverUrl(answers({ runtime: 'any', familiarity: null }), 1));
    expect(q.get('with_runtime.gte')).toBeNull();
    expect(q.get('with_runtime.lte')).toBeNull();
    expect(q.get('sort_by')).toBe('popularity.desc');
    expect(q.get('vote_count.gte')).toBe('100');
  });

  it('servis seçili değilse watch_region/with_watch_providers gönderilmez', () => {
    const q = paramsOf(discoverUrl(answers({ providers: [], region: 'TR' }), 1));
    expect(q.has('watch_region')).toBe(false);
    expect(q.has('with_watch_providers')).toBe(false);
  });
});

describe('normalizeDiscoverPage', () => {
  it('idsiz/başlıksız satırları atar, id ile tekilleştirir', () => {
    const out = normalizeDiscoverPage(
      {
        results: [
          { id: 1, title: 'Bir' },
          { title: 'Idsiz' },
          { id: 0, title: 'Sıfır id' },
          { id: 2 },
          { id: 1, title: 'Bir (tekrar)' },
          { id: 'üç', title: 'Metin id' },
        ],
      },
      'movie',
    );
    expect(out.map((c) => c.ref.id)).toEqual([1]);
  });

  it('dizi satırlarında name/first_air_date doğru eşleşir', () => {
    const out = normalizeDiscoverPage(
      { results: [{ id: 5, name: 'Dizi Adı', first_air_date: '2019-04-01', popularity: 3.5 }] },
      'tv',
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      ref: { kind: 'tv', id: 5, title: 'Dizi Adı' },
      title: 'Dizi Adı',
      releaseDate: '2019-04-01',
      popularity: 3.5,
    });
  });

  it('bozuk/girdisiz sayfalar asla patlamaz: boş dizi döner', () => {
    expect(normalizeDiscoverPage({}, 'movie')).toEqual([]);
    expect(normalizeDiscoverPage(null, 'movie')).toEqual([]);
    expect(normalizeDiscoverPage({ results: null }, 'tv')).toEqual([]);
    expect(normalizeDiscoverPage({ results: [] }, 'tv')).toEqual([]);
    expect(normalizeDiscoverPage('string', 'movie')).toEqual([]);
    // Tek tek bozuk satırlar sağlam olanı etkilemez (null dahil — guard eklendi).
    const mixed = normalizeDiscoverPage(
      {
        results: [
          3,
          { id: 'x', title: 'Y' },
          { id: 8, title: '  ' },
          { id: 9, title: 'Sağlam', vote_average: 'yüksek', genre_ids: [1, 'a', 2] },
        ],
      },
      'movie',
    );
    expect(mixed.map((c) => c.ref.id)).toEqual([9]);
    expect(mixed[0].voteAverage).toBe(0);
    expect(mixed[0].genreIds).toEqual([1, 2]);
  });
});

describe('tmdbFetch', () => {
  it('OK yanıt ayrıştırılmış JSON döner ve BASE_URL ile çağırır', async () => {
    const fetchMock = vi.fn(async (_url: string) =>
      jsonResponse({ genres: [{ id: 35, name: 'Komedi' }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const out = await tmdbFetch<{ genres: unknown[] }>('/genre/movie/list?language=tr-TR');
    expect(out.genres).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${TMDB_CONFIG.BASE_URL}/genre/movie/list?language=tr-TR`,
    );
  });

  it('TMDB hata gövdesi SeansApiError olarak status_code + message taşır', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ status_code: 7, status_message: 'Kimlik doğrulanamadı' }, 401)),
    );
    const err = (await tmdbFetch('/discover/movie').catch((e) => e)) as SeansApiError;
    expect(err).toBeInstanceOf(SeansApiError);
    expect(err.status).toBe(401);
    expect(err.statusCode).toBe(7);
    expect(err.message).toBe('Kimlik doğrulanamadı');
  });

  it('ağ hatası (fetch reject) FETCH_ERROR durumuna dönüşür', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('network down'))));
    const err = (await tmdbFetch('/discover/movie').catch((e) => e)) as SeansApiError;
    expect(err).toBeInstanceOf(SeansApiError);
    expect(err.status).toBe('FETCH_ERROR');
  });
});

describe('fetchCandidatePool', () => {
  const discoverAnswers = answers();
  const pageBody = (ids: number[]) => ({
    results: ids.map((id) => ({ id, title: `Film ${id}` })),
  });

  it('iki sayfayı birleştirip id bazında tekilleştirir', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const pageNo = new URL(String(url), 'https://t.test').searchParams.get('page');
      return jsonResponse(pageBody(pageNo === '2' ? [20, 21] : [10, 20]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const pool = await fetchCandidatePool(discoverAnswers);
    expect(pool.map((c) => c.ref.id)).toEqual([10, 20, 21]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tek sayfa hata verirse diğer sayfanın adayları yine de döner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const pageNo = new URL(String(url), 'https://t.test').searchParams.get('page');
        if (pageNo === '2') return jsonResponse({ status_code: 34, status_message: 'sayfa yok' }, 500);
        return jsonResponse(pageBody([10, 20]));
      }),
    );
    const pool = await fetchCandidatePool(discoverAnswers);
    expect(pool.map((c) => c.ref.id)).toEqual([10, 20]);
  });

  it('her iki sayfa da hata verirse hata fırlar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ status_code: 7, status_message: 'hata' }, 500)),
    );
    const err = await fetchCandidatePool(discoverAnswers).catch((e) => e);
    expect(err).toBeInstanceOf(SeansApiError);
  });
});

describe('withApiKey', () => {
  it('test ortamında (PROD=false) URL değişmeden döner', () => {
    expect(withApiKey('/discover/movie?page=1')).toBe('/discover/movie?page=1');
    expect(withApiKey('/genre/tv/list')).toBe('/genre/tv/list');
  });
});
