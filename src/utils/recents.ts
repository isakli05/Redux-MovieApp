import type { MediaSummary } from '@/types/mediaSummary'

/**
 * Recently-viewed tracking for the "Son Baktıklarınız" rail (real state only —
 * no fabricated personalization; defect T). Stores a compact, capped list in
 * localStorage under `lmdb_recents`.
 */

const KEY = 'lmdb_recents'
const LIMIT = 20

export interface RecentEntry {
  id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  at: number
}

export function getRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentEntry =>
        e && typeof e.id === 'number' && (e.media_type === 'movie' || e.media_type === 'tv') && typeof e.title === 'string'
    )
  } catch {
    return []
  }
}

/** Record a visit from a movie/TV detail page. Safe no-op on storage errors. */
export function recordVisit(item: Pick<MediaSummary, 'id' | 'media_type' | 'title' | 'poster_path'>) {
  if (item.media_type === 'person') return
  try {
    const next: RecentEntry[] = [
      { id: item.id, media_type: item.media_type, title: item.title, poster_path: item.poster_path, at: Date.now() },
      ...getRecents().filter((e) => !(e.id === item.id && e.media_type === item.media_type))
    ].slice(0, LIMIT)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable (private mode/quota) — silently skip
  }
}

export function clearRecents() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
