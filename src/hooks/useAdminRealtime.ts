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

// Stop auto-reconnecting after this many consecutive transient failures and ask
// the user to reload. EventSource otherwise reconnects at the server's `retry:`
// cadence indefinitely — fine for a healthy service, but a sustained outage
// should not hammer the serverless function.
const MAX_RECONNECT_ATTEMPTS = 8;

export function useAdminRealtime<T = unknown>(stream: RealtimeStream): UseAdminRealtimeResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  // Ref mirror of `data` so the onerror handler — which intentionally does NOT
  // list `data` as a dependency (one EventSource per stream per mount) — reads
  // the LATEST value instead of the mount-time null. Otherwise every transient
  // transport drop would flip `loading` back to true even when we already have
  // data (skeleton flicker on /admin/activity, /applications, /jobs each cycle).
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    // EventSource is browser-only; the effect never runs on the server.
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    setLoading(true);
    let closedByUs = false;
    let retries = 0;
    const es = new EventSource(`/api/admin/realtime/${stream}`);

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
      retries = 0; // a successful frame resets the reconnect budget
      dataRef.current = payload as T;
      setData(payload as T);
      setError(null);
      setLoading(false);
      setLastUpdated(Date.now());
    };

    es.onerror = () => {
      // If we closed it ourselves (terminal __error / cap reached), nothing to do.
      if (closedByUs) return;
      // If the connection is CLOSED (e.g. 401 — SSE never started, or the server
      // refused), EventSource will NOT auto-reconnect: surface + stop.
      if (es.readyState === EventSource.CLOSED) {
        setError('Realtime connection closed. Reload to retry.');
        setLoading(false);
        return;
      }
      // Otherwise it's a transient transport drop (proxy / maxDuration) —
      // EventSource auto-reconnects. Cap consecutive failures so a sustained
      // outage does not hammer the function; keep the last data visible.
      retries += 1;
      if (retries > MAX_RECONNECT_ATTEMPTS) {
        closedByUs = true;
        es.close();
        setError('Realtime connection could not be restored. Reload the page to retry.');
        setLoading(false);
        return;
      }
      setError('Realtime connection interrupted — reconnecting…');
      // Loading stays false if we already have data (read via the ref, not the
      // stale closed-over `data`); only show the skeleton if we never got first
      // data after reconnect.
      if (dataRef.current === null) setLoading(true);
    };

    return () => {
      closedByUs = true;
      es.close();
    };
    // Deliberately depend only on `stream` — one EventSource per stream per mount.
    // (dataRef + the React state setters are stable, so react-hooks/exhaustive-deps
    //  is satisfied with [stream] alone — no suppression needed.)
  }, [stream]);

  return { data, loading, error, lastUpdated };
}
