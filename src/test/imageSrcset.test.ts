import { describe, expect, it } from 'vitest'
import { backdropSrcset, posterSrcset } from '@utils/image.utils'

describe('responsive srcset helpers', () => {
  it('posterSrcset covers w342/w500/w780', () => {
    expect(posterSrcset('/poster.jpg')).toBe(
      [
        'https://image.tmdb.org/t/p/w342/poster.jpg 342w',
        'https://image.tmdb.org/t/p/w500/poster.jpg 500w',
        'https://image.tmdb.org/t/p/w780/poster.jpg 780w',
      ].join(', ')
    )
  })

  it('backdropSrcset covers w780/w1280/original', () => {
    expect(backdropSrcset('/backdrop.jpg')).toBe(
      [
        'https://image.tmdb.org/t/p/w780/backdrop.jpg 780w',
        'https://image.tmdb.org/t/p/w1280/backdrop.jpg 1280w',
        'https://image.tmdb.org/t/p/original/backdrop.jpg 3840w',
      ].join(', ')
    )
  })

  it('returns an empty string when the path is missing', () => {
    expect(posterSrcset(null)).toBe('')
    expect(posterSrcset(undefined)).toBe('')
    expect(backdropSrcset(null)).toBe('')
    expect(backdropSrcset(undefined)).toBe('')
  })
})
