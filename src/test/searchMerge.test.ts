/**
 * SearchBar'ın dışa aktardığı saf arama yardımcıları — birim testleri.
 */

import { describe, expect, it } from 'vitest';
import {
  formatCount,
  mergeSearchResults,
  mergedTotalPages,
  mergedTotalResults,
  resultRoute,
  resultSubtitle,
  resultTitle,
  resultYear,
} from '@components/Search/SearchBar';
import type { MultiSearchItem, MultiSearchResults } from '@/types/search';

const movie = (id: number, title: string, extra: Partial<MultiSearchItem> = {}): MultiSearchItem => ({
  id,
  media_type: 'movie',
  title,
  popularity: 10,
  ...extra,
});

const page = (results: MultiSearchItem[], totalResults = results.length, totalPages = 1): MultiSearchResults => ({
  page: 1,
  results,
  total_results: totalResults,
  total_pages: totalPages,
});

describe('mergeSearchResults', () => {
  it('TR + EN sonuçlarını media_type-id üzerinden dedupe eder (TR tercihli)', () => {
    const tr = page([movie(1, 'Zift'), movie(2, 'Kader')])
    const en = page([movie(1, 'Inception (EN)'), movie(3, 'Interstellar')])
    const merged = mergeSearchResults(tr, en)

    expect(merged.map((item) => item.id)).toEqual([1, 2, 3])
    // id=1 için TR sonucu korunur, EN kopyası atılır.
    expect(resultTitle(merged[0])).toBe('Zift')
  })

  it('taraf yoksa boş döner, hiç fırlatmaz', () => {
    expect(mergeSearchResults(undefined, undefined)).toEqual([])
    expect(mergeSearchResults(page([]), undefined)).toEqual([])
  })
})

describe('mergedTotalResults / mergedTotalPages', () => {
  it('iki dilin resmi API toplamlarından büyüğünü alır (defect L)', () => {
    const tr = page([movie(1, 'a')], 1234, 63)
    const en = page([movie(1, 'a')], 1200, 60)
    expect(mergedTotalResults(tr, en)).toBe(1234)
    expect(mergedTotalPages(tr, en)).toBe(63)
  })

  it('TMDB 500 sayfa üst sınırını uygular', () => {
    const tr = page([movie(1, 'a')], 10000, 501)
    expect(mergedTotalPages(tr, undefined)).toBe(500)
  })
})

describe('formatCount', () => {
  it('sayıları tr-TR biçimler (binlik ayırıcı nokta)', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(42)).toBe('42')
  })
})

describe('result yardımcıları', () => {
  it('başlık, yıl, alt satır ve rota türetir', () => {
    const item: MultiSearchItem = {
      id: 7,
      media_type: 'tv',
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      popularity: 50,
    }
    expect(resultTitle(item)).toBe('Breaking Bad')
    expect(resultYear(item)).toBe('2008')
    expect(resultSubtitle(item)).toBe('Dizi · 2008')
    expect(resultRoute(item)).toBe('/tv/7')
  })

  it('kişilerde bölüm (known_for_department) gösterilir', () => {
    const person: MultiSearchItem = {
      id: 9,
      media_type: 'person',
      name: 'Tom Hanks',
      known_for_department: 'Acting',
      popularity: 30,
    }
    expect(resultSubtitle(person)).toBe('Kişi · Acting')
    expect(resultRoute(person)).toBe('/person/9')
  })
})
