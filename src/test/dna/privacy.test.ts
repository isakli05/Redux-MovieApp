/**
 * Gizlilik negatif testleri: kapsamlar arası sızıntı yok, anonim özet kimlik
 * taşımaz, geri alma (olay silme) profili gerçekten yeniden hesaplatır.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearInteractions,
  listInteractions,
  logInteraction,
  removeInteraction,
} from '../../lib/interactions';
import { deriveDnaProfile, exportGroupSummary } from '../../lib/dna/profile';
import { shareText } from '../../lib/dna/share';
import type { MetaMap, TitleMeta } from '../../lib/dna/meta';

const movie = (id: number, title?: string) => ({ kind: 'movie' as const, id, title });

function meta(id: number, genres: number[]): TitleMeta {
  return { key: `movie:${id}`, kind: 'movie', id, genres, year: 2015, runtime: 110, voteAverage: 7 };
}

beforeEach(() => {
  localStorage.clear();
  clearInteractions();
  clearInteractions(42);
});

describe('kapsam izolasyonu', () => {
  it('anonim olaylar hesap kapsamından okunamaz (ve tersi)', () => {
    logInteraction({ kind: 'like', target: movie(1, 'Anonim Beğeni'), source: 'dna' }); // anonim
    logInteraction({ kind: 'like', target: movie(2, 'Hesap Beğenisi'), source: 'dna' }, 42);

    const anonEvents = listInteractions();
    const acctEvents = listInteractions(42);
    expect(anonEvents.map((e) => e.target.id)).toEqual([1]);
    expect(acctEvents.map((e) => e.target.id)).toEqual([2]);

    const m: MetaMap = { 'movie:1': meta(1, [878]), 'movie:2': meta(2, [878]) };
    const anonProfile = deriveDnaProfile(anonEvents, m);
    const acctProfile = deriveDnaProfile(acctEvents, m);
    // Hesap profili anonim olayın kanıtını içermez.
    expect(anonProfile.counts.likes).toBe(1);
    expect(acctProfile.counts.likes).toBe(1);
    expect(exportGroupSummary(acctProfile).genres['movie:878']).toBe(1);
    // ve anonim profildeki kanıt sayısı hesap olaylarıyla artmaz.
    expect(anonProfile.signalCount).toBe(1);
  });

  it('deviceId grup özetine ve profil çıktılarına sızmaz', () => {
    logInteraction({ kind: 'like', target: movie(1, 'Başlık X'), source: 'dna' });
    const deviceId = localStorage.getItem('lmdb:deviceId') ?? 'device-secret';
    const m: MetaMap = { 'movie:1': meta(1, [878]) };
    const p = deriveDnaProfile(listInteractions(), m);
    expect(JSON.stringify(exportGroupSummary(p))).not.toContain(deviceId);
    expect(shareText(p)).not.toContain(deviceId);
  });
});

describe('geri alınabilirlik', () => {
  it('olay kaldırınca profil yeniden hesaplanır — kanıt ve boyut düşer', () => {
    const e1 = logInteraction({ kind: 'like', target: movie(1), source: 'dna' });
    logInteraction({ kind: 'like', target: movie(2), source: 'dna' });
    const m: MetaMap = { 'movie:1': meta(1, [878]), 'movie:2': meta(2, [878]) };
    const before = deriveDnaProfile(listInteractions(), m);
    expect(before.genreDims.find((d) => d.key === 'movie:878')?.evidenceCount).toBe(2);

    removeInteraction(e1.id);
    const after = deriveDnaProfile(listInteractions(), m);
    expect(after.genreDims.find((d) => d.key === 'movie:878')?.evidenceCount).toBe(1);
    expect(after.signalCount).toBe(1);
  });

  it('tümü silinince profil boşalır', () => {
    logInteraction({ kind: 'rating', target: movie(1), value: 9, source: 'dna' });
    clearInteractions();
    const p = deriveDnaProfile(listInteractions(), { 'movie:1': meta(1, [878]) });
    expect(p.signalCount).toBe(0);
    expect(p.genreDims).toEqual([]);
  });
});
