/**
 * Typed media identity — the canonical way LMDB references a TMDB entity.
 * movie:123 and tv:123 are different entities; every cross-feature contract
 * (interaction log, tracker progress, universe nodes, group candidates)
 * carries a MediaRef, never a bare numeric id.
 */
export type MediaKind = 'movie' | 'tv' | 'person';

export interface MediaRef {
  kind: MediaKind;
  id: number;
  /** Display title (or person name) — convenience for UI lists, not identity. */
  title?: string;
  posterPath?: string | null;
}

/** Canonical stable key, e.g. `movie:550`, `tv:1399`, `person:287`. */
export function mediaKey(ref: Pick<MediaRef, 'kind' | 'id'>): string {
  return `${ref.kind}:${ref.id}`;
}

/** Parse a canonical key back into a ref; null when malformed. */
export function parseMediaKey(key: string): Pick<MediaRef, 'kind' | 'id'> | null {
  const sep = key.indexOf(':');
  if (sep <= 0) return null;
  const kind = key.slice(0, sep);
  const id = Number(key.slice(sep + 1));
  if ((kind !== 'movie' && kind !== 'tv' && kind !== 'person') || !Number.isInteger(id) || id <= 0) {
    return null;
  }
  return { kind, id };
}
