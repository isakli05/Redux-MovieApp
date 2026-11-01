/**
 * Birlikte İzle — opsiyonel, savunmacı DNA köprüsü (SHARED_CONTRACTS §H).
 *
 * Kullanıcı isterse ANONİM bir tür özeti (yalnızca genre id'leri) kendi
 * oylarını ağırlamak için odaya bağlar. Özet, pm-cinema-dna'nın
 * `exportGroupSummary(profile)` sözleşmesinden alınır (src/lib/dna/profile.ts,
 * integration commit 3c82598): dönen `genres`, `movie:35 → 0.78` biçiminde
 * tür meyilleridir; buradan yalnızca sayısal tür id'leri çıkarılır — başlık,
 * kişi veya kimlik asla odaya gitmez, başka katılımcının verisi cihazdan çıkmaz.
 *
 * `src/lib/dna/` bu dala henüz birleşmedi (pm-cinema-dna paralel çalışır):
 * import.meta.glob eşleşme yoksa {} döner, derleme çökmez; birleşince modül
 * ayrı bir chunk olarak yüklenir. Koşullu derleme tek noktada, burada.
 */

export interface AnonymousTasteSummary {
  /** Sevilen türlerin TMDB id'leri (kimlik/yorum/başlık YOK), en yüksek meyilli 8. */
  genres: number[];
}

/** pm-cinema-dna sözleşmesinin bu köprünün kullandığı yüzeyi. */
interface DnaProfileModule {
  deriveDnaProfile(events: unknown[], meta: unknown): unknown;
  listInteractions(accountId?: number | null): unknown[];
  loadMetaCache(): unknown;
  exportGroupSummary(profile: unknown): { version: 1; genres: Record<string, number> };
}

const dnaModules = import.meta.glob('/src/lib/dna/profile.ts');

/** `movie:35` anahtarlarından tür id'lerini çıkar; meyile göre sırala. */
export function genreIdsFromSummary(summary: { genres: Record<string, number> }): number[] {
  return Object.entries(summary.genres)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => Number(key.slice(key.indexOf(':') + 1)))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 8);
}

export async function loadAnonymousTaste(): Promise<AnonymousTasteSummary | null> {
  const load = Object.values(dnaModules)[0];
  if (!load) return null; // DNA modülü bu derlemede yok — DNA'sız devam
  try {
    const dna = (await load()) as unknown as DnaProfileModule;
    const profile = dna.deriveDnaProfile(dna.listInteractions(), dna.loadMetaCache());
    const summary = dna.exportGroupSummary(profile);
    const genres = genreIdsFromSummary(summary);
    return genres.length > 0 ? { genres } : null;
  } catch {
    // Modül sözleşmesi değişti / türetilen profil bozuk — DNA'sız devam.
    return null;
  }
}
