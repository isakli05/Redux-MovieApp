/**
 * Birlikte İzle — oda başına yerel kimlik.
 *
 * Bağlantı kopsa bile aynı tarayıcıda katılımcı kimliği korunur:
 * localStorage['lmdb:group:room/<code>'] = {pid, hostKey?}.
 * hostKey YALNIZ ev sahibinin cihazında tutulur ve asla paylaşılmaz.
 */

export interface RoomIdentity {
  pid: string;
  hostKey?: string;
}

const PREFIX = 'lmdb:group/room/';

export function loadIdentity(code: string): RoomIdentity | null {
  try {
    const raw = localStorage.getItem(PREFIX + code);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { pid } = parsed as { pid?: unknown };
    return typeof pid === 'string' && pid.startsWith('p_')
      ? (parsed as RoomIdentity)
      : null;
  } catch {
    return null;
  }
}

export function saveIdentity(code: string, identity: RoomIdentity): void {
  try {
    localStorage.setItem(PREFIX + code, JSON.stringify(identity));
  } catch {
    /* storage kapalıysa kimlik yalnız oturumluk yaşar */
  }
}

export function clearIdentity(code: string): void {
  try {
    localStorage.removeItem(PREFIX + code);
  } catch {
    /* yoksay */
  }
}
