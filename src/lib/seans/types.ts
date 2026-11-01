/**
 * LMDB Seans — tip sözleşmeleri (pm-seans).
 * "Bu akşam ne izlesem" karar yolculuğunun saf veri şekilleri; UI ve testler
 * bu tipler üzerinden konuşur.
 */
import type { MediaRef } from '../mediaRef';

export type SeansKind = 'movie' | 'tv';

/** Ruh hâli kimlikleri — TMDB'de "mood" alanı YOKTUR; her mood dürüst
 *  vekillerle (tür ağırlıkları + puan eşiği) eşleştirilir (config.ts). */
export type MoodId =
  | 'thrill'
  | 'laugh'
  | 'feel'
  | 'mind'
  | 'dark'
  | 'epic'
  | 'cozy'
  | 'real';

export type RuntimeWindowId = 'short' | 'medium' | 'long' | 'any';

export type FamiliarityId = 'familiar' | 'adventurous';

/** Bir seansın adımlarda toplanan cevapları — tamamı sıralanabilir/deterministik. */
export interface SeansAnswers {
  kind: SeansKind;
  mood: MoodId | null;
  runtime: RuntimeWindowId;
  /** Seçilen TMDB tür id'leri (boşsa tür filtresi uygulanmaz). */
  genres: number[];
  familiarity: FamiliarityId | null;
  /** Seçilen sağlayıcı id'leri (boşsa servis filtresi yok). */
  providers: number[];
  /** watch_region — useRegion'dan gelir, sağlayıcı filtresi varsa zorunlu. */
  region: string;
  /** Cinema Universe derin bağlantısı: `?seed=movie:123`. */
  seed: MediaRef | null;
}

/** Discover sonucundan normalize edilmiş aday. */
export interface SeansCandidate {
  ref: MediaRef;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  releaseDate: string | null;
  genreIds: number[];
  popularity: number;
}

export type MatchReasonKind =
  | 'genre'
  | 'mood'
  | 'quality'
  | 'era'
  | 'taste'
  | 'novelty'
  | 'provider'
  | 'runtime'
  | 'seed';

/** Adayın PUANINI GERÇEKTEN BESLEYEN kriterler — uydurma sebep yok. */
export interface MatchReason {
  kind: MatchReasonKind;
  label: string;
}

export interface RankedCandidate {
  candidate: SeansCandidate;
  /** 0–100 aralığına yuvarlanmış ağırlıklı toplam. */
  score: number;
  reasons: MatchReason[];
}

/** Puanlama bağlamı — testlerde sabitlenir, üretimde oturumdan gelir. */
export interface SeansContext {
  /** TMDB tür id → Türkçe ad (sebep metinleri için). */
  genreNames: Record<number, string>;
  /** Etkileşim günlüğünden türetilen tür ağırlıkları (taste.ts). */
  affinity: GenreAffinity;
  /** Seçilen sağlayıcı id → ad (varsa). */
  providerNames: Record<number, string>;
  /** Seed yapımının tür id'leri (Cinema Universe derin bağlantısı, varsa). */
  seedGenreIds?: number[];
  /** Determinizm: testler sabit zaman verir. Üretimde Date.now(). */
  now: number;
}

export interface GenreAffinity {
  /** Tür id → pozitif ağırlık (beğeni, yüksek puan, takip). */
  positive: Record<number, number>;
  /** Tür id → negatif ağırlık (dislike, düşük puan). */
  negative: Record<number, number>;
  /** Günlükte en az bir sinyal var mı? */
  hasData: boolean;
}
