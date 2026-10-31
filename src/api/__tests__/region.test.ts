import { afterEach, describe, expect, it } from 'vitest';
import {
  deriveRegionFromNavigator,
  FALLBACK_REGION,
  REGION_STORAGE_KEY,
} from '../../hooks/useRegion';

/** jsdom defines `language` as a prototype getter — override on the instance. */
const setNavigatorLanguage = (value: string): void => {
  Object.defineProperty(window.navigator, 'language', {
    value,
    configurable: true,
  });
};

afterEach(() => {
  setNavigatorLanguage('en-US');
});

describe('deriveRegionFromNavigator (fix I default)', () => {
  it('derives the territory from a BCP-47 language tag', () => {
    expect(deriveRegionFromNavigator('tr-TR')).toBe('TR');
    expect(deriveRegionFromNavigator('en-US')).toBe('US');
    expect(deriveRegionFromNavigator('de-DE')).toBe('DE');
  });

  it('accepts underscore separators and lower-case territories', () => {
    expect(deriveRegionFromNavigator('en_us')).toBe('US');
    expect(deriveRegionFromNavigator('tr-tr')).toBe('TR');
  });

  it('falls back when the tag has no usable territory', () => {
    expect(deriveRegionFromNavigator('tr')).toBe(FALLBACK_REGION);
    expect(deriveRegionFromNavigator('es-419')).toBe(FALLBACK_REGION); // 3-digit UN region
    expect(deriveRegionFromNavigator('')).toBe(FALLBACK_REGION);
    expect(deriveRegionFromNavigator(undefined)).toBe(FALLBACK_REGION);
    expect(deriveRegionFromNavigator(null)).toBe(FALLBACK_REGION);
  });

  it('is consistent with the persisted storage key contract', () => {
    expect(REGION_STORAGE_KEY).toBe('lmdb_region');
  });

  it('mocked navigator.language drives the derivation', () => {
    setNavigatorLanguage('de-DE');
    expect(deriveRegionFromNavigator(navigator.language)).toBe('DE');
    setNavigatorLanguage('tr-TR');
    expect(deriveRegionFromNavigator(navigator.language)).toBe('TR');
  });
});
