/**
 * LMDB Seans — oturum kalıntıları: kısa geçmiş + kısıt gevşetme.
 * Kalıcılık: `lmdb:seans:history` (SHARED_CONTRACTS §E — kısa geçmiş).
 */
import type { RuntimeWindowId, SeansAnswers } from './types';

const HISTORY_KEY = 'lmdb:seans:history';
const HISTORY_CAP = 8;

export interface SeansHistoryEntry {
  at: number;
  title: string;
  /** `movie:123` biçiminde anahtar. */
  key: string;
}

export function loadHistory(): SeansHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SeansHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: SeansHistoryEntry): SeansHistoryEntry[] {
  const next = [...loadHistory().filter((e) => e.key !== entry.key), entry].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* kota/pixel modu: geçmiş bu oturum için yok sayılır */
  }
  return next;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* yoksay */
  }
}

// --- Kısıt gevşetme (boş sonuç kurtarması) -----------------------------------
//
// Boş sonuç gelirse kısıtlar SIRAYLA, en olası kurtarıcıdan başlayarak
// tek tek gevşetilir; kullanıcı her tıklamada bir adım geri verir.

export interface LoosenSuggestion {
  /** Uygulanacak kısmi cevap değişikliği. */
  patch: Partial<SeansAnswers>;
  /** Kullanıcıya gösterilecek açıklama. */
  note: string;
}

export function suggestLoosen(answers: SeansAnswers): LoosenSuggestion | null {
  if (answers.providers.length > 0) {
    return {
      patch: { providers: [] },
      note: 'Yayın servisi filtresini kaldıralım — her serviste arayalım.',
    };
  }
  if (answers.runtime !== 'any') {
    const current: RuntimeWindowId = answers.runtime;
    return {
      patch: { runtime: 'any' },
      note:
        current === 'short'
          ? 'Süre penceresini kaldıralım — kısa yapımlar az bulunur.'
          : 'Süre penceresini kaldıralım — her uzunlukta arayalım.',
    };
  }
  if (answers.genres.length > 0) {
    return {
      patch: { genres: [] },
      note: 'Tür seçimlerini bırakıp yalnız ruh hâliyle arayalım.',
    };
  }
  if (answers.mood !== null) {
    return {
      patch: { mood: null, familiarity: 'familiar' },
      note: 'Ruh hâli eşleşmesini de bırakıp geniş bir tarama yapalım.',
    };
  }
  return null;
}

/** Tek gevşetme adımını uygular (saf). */
export function applyLoosen(answers: SeansAnswers, suggestion: LoosenSuggestion | null): SeansAnswers {
  if (!suggestion) return answers;
  return { ...answers, ...suggestion.patch };
}
