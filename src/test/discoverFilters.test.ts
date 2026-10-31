/**
 * Keşfet filtre mantığı — URL ayrıştırma/serileştirme, sorgu üretimi (puan
 * sıralaması ↔ vote_count tabanı eşleşmesi dahil), özet cümle ve çipler.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISCOVER_FILTERS,
  RATING_SORT_VOTE_FLOOR,
  activeFilterChips,
  filterSummaryParts,
  filtersToQuery,
  parseDiscoverFilters,
  serializeDiscoverFilters,
} from '@components/Discover/discoverFilters';

const params = (search: string): URLSearchParams => new URLSearchParams(search)

describe('parseDiscoverFilters', () => {
  it('geçerli tüm parametreleri okur', () => {
    const state = parseDiscoverFilters(params('?tur=tv&turler=18,10759&yil=2015-2020&puan=7&dil=tr&sirala=rating'))
    expect(state).toEqual({
      type: 'tv',
      genres: [18, 10759],
      yearFrom: 2015,
      yearTo: 2020,
      minRating: 7,
      language: 'tr',
      sort: 'rating',
    })
  })

  it('bozuk değerler sessizce varsayılana düşer', () => {
    const state = parseDiscoverFilters(params('?tur=box&turler=abc,,18,18&yil=9999&puan=3&dil=fr&sirala=nope'))
    expect(state.type).toBe('movie')
    expect(state.genres).toEqual([18])
    expect(state.yearFrom).toBeNull()
    expect(state.yearTo).toBeNull()
    expect(state.minRating).toBe(0)
    expect(state.language).toBe('')
    expect(state.sort).toBe('popularity')
  })

  it('ters yıl aralığını düzeltir; tek yıl da geçerlidir', () => {
    expect(parseDiscoverFilters(params('?yil=2020-1990'))).toMatchObject({ yearFrom: 1990, yearTo: 2020 })
    expect(parseDiscoverFilters(params('?yil=2019'))).toMatchObject({ yearFrom: 2019, yearTo: 2019 })
  })
})

describe('serializeDiscoverFilters ⇄ parse round-trip', () => {
  it('varsayılanlar boş; varsayılan olmayanlar yazılır', () => {
    expect(serializeDiscoverFilters(DEFAULT_DISCOVER_FILTERS)).toEqual({ tur: 'movie' })

    const state = parseDiscoverFilters(params('?tur=tv&turler=18,80&yil=1990-2000&puan=8&dil=en&sirala=votes'))
    expect(serializeDiscoverFilters(state)).toEqual({
      tur: 'tv',
      turler: '18,80',
      yil: '1990-2000',
      puan: '8',
      dil: 'en',
      sirala: 'votes',
    })
  })
})

describe('filtersToQuery', () => {
  it('varsayılan: yalnız popularity sıralaması', () => {
    expect(filtersToQuery(DEFAULT_DISCOVER_FILTERS)).toBe('sort_by=popularity.desc')
  })

  it('çoklu tür OR ile birleşir; yıl/dil/puan eşlemeleri film alanlarını kullanır', () => {
    const state = {
      ...DEFAULT_DISCOVER_FILTERS,
      genres: [28, 878],
      yearFrom: 2020,
      yearTo: 2026,
      minRating: 7 as const,
      language: 'tr' as const,
    }
    expect(filtersToQuery(state)).toBe(
      'with_genres=28|878' +
        '&primary_release_date.gte=2020-01-01' +
        '&primary_release_date.lte=2026-12-31' +
        '&vote_average.gte=7' +
        '&with_original_language=tr' +
        '&sort_by=popularity.desc',
    )
  })

  it('dizilerde tarih alanı first_air_date olur', () => {
    const query = filtersToQuery({ ...DEFAULT_DISCOVER_FILTERS, type: 'tv', yearFrom: 2019 })
    expect(query).toContain('first_air_date.gte=2019-01-01')
  })

  it('puan sıralaması vote_count tabanıyla OTOMATİK eşlenir (≥300)', () => {
    const query = filtersToQuery({ ...DEFAULT_DISCOVER_FILTERS, sort: 'rating' })
    expect(query).toContain(`vote_count.gte=${RATING_SORT_VOTE_FLOOR}`)
    expect(query).toContain('sort_by=vote_average.desc')
  })

  it('tarih sıralaması türe göre alan seçer (asc/desc)', () => {
    expect(filtersToQuery({ ...DEFAULT_DISCOVER_FILTERS, sort: 'date_desc' })).toContain(
      'sort_by=primary_release_date.desc',
    )
    expect(filtersToQuery({ ...DEFAULT_DISCOVER_FILTERS, type: 'tv', sort: 'date_asc' })).toContain(
      'sort_by=first_air_date.asc',
    )
  })
})

describe('filterSummaryParts', () => {
  it('filtresiz: sadece tür adı', () => {
    expect(filterSummaryParts(DEFAULT_DISCOVER_FILTERS)).toEqual(['filmler'])
    expect(filterSummaryParts({ ...DEFAULT_DISCOVER_FILTERS, type: 'tv' })).toEqual(['diziler'])
  })

  it('tam örnek: "Aksiyon, Bilim Kurgu filmleri · 2020–2026 · 7+ puan · Türkçe"', () => {
    const parts = filterSummaryParts({
      ...DEFAULT_DISCOVER_FILTERS,
      genres: [28, 878],
      yearFrom: 2020,
      yearTo: 2026,
      minRating: 7,
      language: 'tr',
    })
    expect(parts).toEqual(['Aksiyon, Bilim Kurgu filmleri', '2020–2026', '7+ puan', 'Türkçe'])
  })

  it('3+ türde ilk ikisi + artık sayı; açık uçlu yıl aralığı', () => {
    const parts = filterSummaryParts({
      ...DEFAULT_DISCOVER_FILTERS,
      genres: [28, 12, 35],
      yearFrom: 2000,
    })
    expect(parts).toEqual(['Aksiyon, Macera +1 filmleri', '2000+'])
  })
})

describe('activeFilterChips', () => {
  it('her aktif filtre tek çip; türler tek tek kaldırılabilir', () => {
    const state = {
      ...DEFAULT_DISCOVER_FILTERS,
      genres: [28, 878],
      yearFrom: 2020,
      yearTo: 2026,
      minRating: 7 as const,
      language: 'tr' as const,
    }
    const chips = activeFilterChips(state)
    expect(chips.map((chip) => chip.id)).toEqual([
      'genre-28',
      'genre-878',
      'year',
      'rating',
      'language',
    ])

    const removeAksiyon = { ...state, ...chips[0].patch }
    expect(removeAksiyon.genres).toEqual([878])

    const removeYear = { ...state, ...chips[2].patch }
    expect(removeYear.yearFrom).toBeNull()
    expect(removeYear.yearTo).toBeNull()
  })

  it('filtre yoksa çip yok', () => {
    expect(activeFilterChips(DEFAULT_DISCOVER_FILTERS)).toEqual([])
  })
})
