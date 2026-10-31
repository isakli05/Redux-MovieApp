import { describe, expect, it } from 'vitest'
import { extractIdFromSlug } from '@utils/slug.utils'

describe('test harness smoke', () => {
  it('runs vitest with path aliases', () => {
    expect(extractIdFromSlug('438631-dune')).toBe('438631')
  })
})
