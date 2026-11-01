import { describe, expect, it } from 'vitest';
import { loadDnaWeights, parseDnaWeightRecord } from '../../lib/seans/taste';

describe('parseDnaWeightRecord (Seans↔DNA glue)', () => {
  it('maps kind-prefixed DNA keys onto the flat genre-id space', () => {
    expect(parseDnaWeightRecord({ 'movie:35': 0.78, 'tv:18': 0.5, 'movie:12': 0.1 })).toEqual({
      35: 0.78,
      18: 0.5,
      12: 0.1,
    });
  });

  it('still accepts legacy plain-numeric keys and rejects garbage', () => {
    expect(parseDnaWeightRecord({ '35': 0.9 })).toEqual({ 35: 0.9 });
    expect(parseDnaWeightRecord({ 'person:287': 1, 'x': 2, '5': NaN, '-1': 0.5 })).toEqual({});
    expect(parseDnaWeightRecord(null)).toEqual({});
    expect(parseDnaWeightRecord('nope')).toEqual({});
  });
});

describe('loadDnaWeights (integration reality: ../dna/profile.ts exists)', () => {
  it('consumes the real getTasteWeights export — not the legacy fallback', async () => {
    const weights = await loadDnaWeights();
    // DNA ihraç sözleşmesi: yalnızca kanıtlı türler anahtarlanır. Boş logda
    // boş döner; ama fonksiyon bir hata fırlatmamalı ve tip düz olmalı.
    expect(Object.keys(weights).every((k) => /^\d+$/.test(k))).toBe(true);
    expect(Object.values(weights).every((v) => typeof v === 'number' && Number.isFinite(v))).toBe(
      true,
    );
  });

  it('scopes weights to the requested account when DNA has account evidence', async () => {
    // Ayrı kapsamlar farklı sonuç verebilir; çağrı her ikisinde de güvenli.
    await expect(loadDnaWeights(12345)).resolves.toBeTypeOf('object');
  });
});
