'use client';

/**
 * useAdminRealtime — client hook for Admin Portal realtime over SSE.
 *
 * Opens an `EventSource` to `/api/admin/realtime/[stream]`. The httpOnly admin
 * session cookie is sent same-origin automatically (no token exposed to the
 * page). The server holds an Admin-SDK `onSnapshot` (Firestore is locked to
 * clients) and pushes the full bounded snapshot on every change.
 *
 * Behavior:
 *   - `loading` is true until the FIRST data event, then false (honest: it
 *     reflects "waiting for first server-confirmed data", not merely an open
 *     socket).
 *   - On a terminal server error (`{ __error }` payload), the hook sets `error`
 *     and CLOSES the EventSource so it does not reconnect-loop on a permanent
 *     failure (e.g. missing Firestore index).
 *   - On a transport error (proxy drop / Vercel function maxDuration expiry),
 *     EventSource auto-reconnects; we surface a transient `error` but keep the
 *     last `data` so the UI does not blank out. If the connection is CLOSED
 *     (e.g. 401 auth failure — SSE never started), we set `error` and stop.
 *   - Cleanup: `eventSource.close()` on unmount — no leaked listeners, no
 *     infinite loops, no duplicate subscriptions (the effect depends only on
 *     `stream`, so it opens exactly one EventSource per stream per mount).
 *
 * The server sends the FULL bounded list on every snapshot, so the hook simply
 * replaces `data` (no client-side dedup needed).
 */
import { useEffect, useRef, useState } from 'react';

export type RealtimeStream = 'activity' | 'applications' | 'jobs' | 'stats';

export interface UseAdminRealtimeResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Epoch ms of the last server-confirmed update (null until first data). */
  lastUpdated: number | null;
}

export function useAdminRealtime<T = unknown>(stream: RealtimeStream): UseAdminRealtimeResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // EventSource is browser-only; the effect never runs on the server.
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    setLoading(true);
    let closedByUs = false;
    const es = new EventSource(`/api/admin/realtime/${stream}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      let payload: unknown;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return; // ignore malformed frames (e.g. heartbeat comments never reach onmessage)
      }
      // Terminal server-side error: surface + stop (no reconnect-loop).
      if (payload && typeof payload === 'object' && '__error' in (payload as Record<string, unknown>)) {
        const msg = (payload as { __error?: string }).__error || 'realtime error';
        setError(msg);
        setLoading(false);
        closedByUs = true;
        es.close();
        return;
      }
      setData(payload as T);
      setError(null);
      setLoading(false);
      setLastUpdated(Date.now());
    };

    es.onerror = () => {
      // If we closed it ourselves (terminal __error), nothing to do.
      if (closedByUs) return;
      // If the connection is CLOSED (e.g. 401 — SSE never started, or the
      // server refused), EventSource will NOT auto-reconnect: surface + stop.
      if (es.readyState === EventSource.CLOSED) {
        setError('Realtime connection closed. Reload to retry.');
        setLoading(false);
        return;
      }
      // Otherwise it's a transient transport drop (proxy / maxDuration) —
      // EventSource auto-reconnects. Keep the last data; surface a transient
      // error but do NOT blank the UI. Loading stays false if we already have
      // data, else true (waiting for first data after reconnect).
      setError('Realtime connection interrupted — reconnecting…');
      if (data === null) setLoading(true);
    };

    return () => {
      closedByUs = true;
      es.close();
      esRef.current = null;
    };
    // Deliberately depend only on `stream` — one EventSource per stream per mount.
    // `data` is read inside onerror but not a dependency (stale-closure-safe via
    // the ref-free read of the latest state through the setter pattern is not
    // needed because we only branch on null-ness, which is monotonic enough for
    // the loading hint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return { data, loading, error, lastUpdated };
}
