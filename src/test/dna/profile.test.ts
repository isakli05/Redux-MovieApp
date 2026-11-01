/**
 * Cinema DNA skorlama birim testleri: boş günlük, seyrek günlük, çelişkili
 * girdi, güven eşikleri ve tohumlanmış olaylardan profil türetimi.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { clearInteractions, type Interaction } from '../../lib/interactions';
import {
  confidenceOf,
  deriveDnaProfile,
  exportGroupSummary,
  tasteWeights,
  titleSignals,
} from '../../lib/dna/profile';
import type { MetaMap, TitleMeta } from '../../lib/dna/meta';

const movie = (id: number, title?: string) => ({ kind: 'movie' as const, id, title });

function meta(
  id: number,
  opts: { genres?: number[]; year?: number; runtime?: number; voteAverage?: number; people?: TitleMeta['people'] } = {},
): TitleMeta {
  return {
    key: `movie:${id}`,
    kind: 'movie',
    id,
    genres: opts.genres ?? [18],
    year: opts.year ?? 2015,
    runtime: opts.runtime ?? 120,
    voteAverage: opts.voteAverage ?? 7.0,
    ...(opts.people ? { people: opts.people } : {}),
  };
}

function metaMap(...items: TitleMeta[]): MetaMap {
  return Object.fromEntries(items.map((m) => [m.key, m]));
}

beforeEach(() => {
  localStorage.clear();
  clearInteractions();
});

describe('confidenceOf eşikleri', () => {
  it('kanıt sayısına göre yükselir; az kanıt asla yüksek güven vermez', () => {
    expect(confidenceOf(0)).toBe('yok');
    expect(confidenceOf(1)).toBe('az');
    expect(confidenceOf(2)).toBe('az'); // 2 puan ≠ "yüksek isabetli"
    expect(confidenceOf(3)).toBe('az');
    expect(confidenceOf(4)).toBe('orta');
    expect(confidenceOf(11)).toBe('orta');
    expect(confidenceOf(12)).toBe('yüksek');
  });
});

describe('deriveDnaProfile', () => {
  it('boş günlük → boş profil, güven yok, boyut yok', () => {
    const p = deriveDnaProfile([], {});
    expect(p.signalCount).toBe(0);
    expect(p.overallConfidence).toBe('yok');
    expect(p.genreDims).toEqual([]);
    expect(p.eraDims).toEqual([]);
    expect(p.people).toEqual([]);
    expect(p.runtime.mean).toBeNull();
    expect(p.ratingBehavior.mean).toBeNull();
  });

  it('seyrek günlük: 2 puan güven "az" olur, "yüksek" asla', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'rating', target: movie(1), value: 8, at: 1, source: 'dna' },
      { id: 'b', kind: 'rating', target: movie(2), value: 9, at: 2, source: 'dna' },
    ];
    const p = deriveDnaProfile(events, metaMap(meta(1), meta(2)));
    expect(p.counts.ratings).toBe(2);
    expect(p.overallConfidence).toBe('az');
    expect(p.ratingBehavior.mean).toBe(8.5);
  });

  it('karşılaştırma kazananı ödüllendirir, kaybedeni hafif cezalandırır', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'comparison_win', target: movie(1), vs: movie(2), at: 1, source: 'dna' },
    ];
    const signals = titleSignals(events);
    expect(signals.get('movie:1')?.score).toBeCloseTo(1);
    expect(signals.get('movie:2')?.score).toBeCloseTo(-0.4);
  });

  it('çelişkili girdi (aynı türe beğeni + olumsuz) affiniteyi nötre çeker', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'like', target: movie(1), at: 1, source: 'dna' },
      { id: 'b', kind: 'dislike', target: movie(2), at: 2, source: 'dna' },
    ];
    const m = metaMap(meta(1, { genres: [878] }), meta(2, { genres: [878] }));
    const p = deriveDnaProfile(events, m);
    const sciFi = p.genreDims.find((d) => d.key === 'movie:878');
    expect(sciFi).toBeDefined();
    expect(sciFi!.affinity).toBeCloseTo(0.5, 1);
    expect(sciFi!.evidenceText).toBe('1 beğeni, 1 olumsuz');
  });

  it('seen olayı skor taşımaz ama izleme sayısına girer', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'seen', target: movie(1), at: 1, source: 'seans' },
    ];
    const p = deriveDnaProfile(events, metaMap(meta(1)));
    expect(p.signalCount).toBe(0);
    expect(p.counts.seen).toBe(1);
    expect(p.genreDims).toEqual([]);
  });

  it('tohumlanmış olaylardan tür/dönem/süre/puan/isim boyutlarını türetir', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'like', target: movie(1), at: 1, source: 'dna' },
      { id: 'b', kind: 'comparison_win', target: movie(2), vs: movie(3), at: 2, source: 'dna' },
      { id: 'c', kind: 'rating', target: movie(2), value: 9, at: 3, source: 'dna' },
    ];
    const m = metaMap(
      meta(1, { genres: [878, 12], year: 2019, runtime: 160, people: [{ id: 287, name: 'Brad Pitt', role: 'cast' }] }),
      meta(2, { genres: [878], year: 2021, runtime: 140, voteAverage: 6.0, people: [{ id: 287, name: 'Brad Pitt', role: 'cast' }] }),
      meta(3, { genres: [35], year: 1994, runtime: 90 }),
    );
    const p = deriveDnaProfile(events, m);

    const sciFi = p.genreDims.find((d) => d.key === 'movie:878');
    expect(sciFi?.affinity).toBeCloseTo(1);
    expect(sciFi?.evidenceCount).toBe(3); // like + karşılaştırma + puan
    const komedi = p.genreDims.find((d) => d.key === 'movie:35');
    expect(komedi?.affinity).toBeCloseTo(0, 1); // karşılaştırmayı kaybetti

    const yirmiler = p.eraDims.find((d) => d.label === "2020'ler");
    expect(yirmiler?.affinity).toBeCloseTo(1);

    expect(p.runtime.mean).toBeGreaterThan(140); // olumlu başlıklar ağırlıklı
    expect(p.runtime.tendency).toBe('uzun');

    expect(p.ratingBehavior.mean).toBe(9);
    expect(p.ratingBehavior.vsTmdb).toBe(3); // 9 − 6.0

    expect(p.people[0]?.name).toBe('Brad Pitt');
    // Brad Pitt: film 1'deki beğeni + film 2'deki karşılaştırma ve puan = 3 olay.
    expect(p.people[0]?.evidenceCount).toBe(3);
  });

  it('rating 5–6 nötrdür: puan davranışına girer, skor taşımaz', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'rating', target: movie(1), value: 5, at: 1, source: 'dna' },
    ];
    const signals = titleSignals(events);
    expect(signals.get('movie:1')?.score).toBe(0);
    const p = deriveDnaProfile(events, metaMap(meta(1)));
    expect(p.ratingBehavior.count).toBe(1);
    expect(p.ratingBehavior.mean).toBe(5);
  });
});

describe('dışa aktarım sözleşmeleri', () => {
  it('tasteWeights yalnız kanıtlı türleri 0–1 arası verir', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'like', target: movie(1), at: 1, source: 'dna' },
      { id: 'b', kind: 'seen', target: movie(2), at: 2, source: 'seans' },
    ];
    const m = metaMap(meta(1, { genres: [878] }), meta(2, { genres: [35] }));
    const w = tasteWeights(deriveDnaProfile(events, m));
    expect(w).toEqual({ 'movie:878': 1 });
  });

  it('group özeti yalnız tür ağırlıkları taşır — başlık/isim yok', () => {
    const events: Interaction[] = [
      { id: 'a', kind: 'like', target: movie(1, 'Gizli Başlık'), at: 1, source: 'dna' },
    ];
    const m = metaMap(meta(1, { genres: [878], people: [{ id: 9, name: 'Gizli İsim', role: 'cast' }] }));
    const s = exportGroupSummary(deriveDnaProfile(events, m));
    const json = JSON.stringify(s);
    expect(s.version).toBe(1);
    expect(s.genres['movie:878']).toBe(1);
    expect(json).not.toContain('Gizli Başlık');
    expect(json).not.toContain('Gizli İsim');
    expect(Object.keys(s)).toEqual(['version', 'genres']);
  });
});
