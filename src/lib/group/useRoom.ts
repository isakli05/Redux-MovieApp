/**
 * useRoom — oda senkronizasyon kancası.
 *
 * Poll tabanlı senkron (≤5 s, SHARED_CONTRACTS §E; WebSocket yok):
 * - 4 s aralıkla getRoom; sekme gizliyken istek atılmaz (görünür olunca
 *   anında bir tazeleme yapılır).
 * - Eylemler (oy, faz, kısıt…) GroupApi üzerinden; dönen view hemen
 *   state'e yazılır → poll beklemeden anında UI.
 * - Sunucudan 'not_in_room' gelirse kimlik geçersiz sayılır (yeniden katılım
 *   akışı UI'da sunulur).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GroupApi, RoomView } from './api';
import { GroupApiError } from './api';

const POLL_MS = 4000;

export type RoomSyncStatus = 'connecting' | 'live' | 'error' | 'not_in_room' | 'gone';

export interface UseRoomResult {
  view: RoomView | null;
  status: RoomSyncStatus;
  error: string | null;
  busy: boolean;
  refresh: () => Promise<void>;
  /** Bir eylem çalıştır: dönen view state'e yazılır, hata error'a düşer. */
  act: (fn: (api: GroupApi) => Promise<RoomView>) => Promise<boolean>;
}

export function useRoom(api: GroupApi, code: string, pid: string | null): UseRoomResult {
  const [view, setView] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<RoomSyncStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const apiRef = useRef(api);
  apiRef.current = api;

  const refresh = useCallback(async () => {
    if (!pid) return;
    try {
      const next = await apiRef.current.getRoom(code, pid);
      setView(next);
      setStatus('live');
      setError(null);
    } catch (e) {
      if (e instanceof GroupApiError && e.code === 'not_in_room') {
        setStatus('not_in_room');
      } else if (e instanceof GroupApiError && (e.status === 404 || e.status === 410)) {
        setStatus('gone');
      } else {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Bilinmeyen hata.');
      }
    }
  }, [code, pid]);

  useEffect(() => {
    if (!pid) return;
    void refresh();
    const id = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, pid]);

  const act = useCallback(
    async (fn: (api: GroupApi) => Promise<RoomView>) => {
      setBusy(true);
      try {
        const next = await fn(apiRef.current);
        setView(next);
        setStatus('live');
        setError(null);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'İşlem başarısız.');
        void refresh(); // sunucudaki gerçek durumu yeniden çek
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  return { view, status, error, busy, refresh, act };
}
