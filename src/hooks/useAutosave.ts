'use client';

import { useEffect, useRef, useState } from 'react';

interface AutosaveOptions {
  /**
   * Retained for backward compatibility (callers still pass a Firestore
   * instance). Ignored — persistence is server-backed via `/api/admin/drafts`
   * (Admin SDK, ownership-enforced) with localStorage as the offline fallback.
   */
  db?: unknown;
  collectionName: 'jobs' | 'blogPosts' | 'drafts';
  docId: string | null;
  data: unknown;
  delay?: number;
  enabled?: boolean;
  /**
   * localStorage key the caller reads for recovery. The hook writes the same
   * payload here on every save (online or offline) so the existing recovery
   * logic keeps working + survives a server outage.
   */
  storageKey?: string;
}

/**
 * Debounced autosave. Persists to the server-backed `/api/admin/drafts` store
 * (ownership-enforced, cross-device) and mirrors the payload to localStorage
 * (the offline / server-failure fallback the recovery logic reads). The
 * `saveStatus` contract ('idle' | 'saving' | 'saved' | 'error' | 'offline') is
 * preserved so callers need no UI changes.
 */
export function useAutosave({
  collectionName,
  docId,
  data,
  delay = 30000,
  enabled = true,
  storageKey,
}: AutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !docId) return;

    const fallbackKey = storageKey ?? `last_sync_${collectionName}_${docId}`;

    const writeLocalBackup = () => {
      if (typeof window === 'undefined') return;
      const payload = dataRef.current as Record<string, unknown> | null;
      try {
        localStorage.setItem(
          fallbackKey,
          JSON.stringify({ ...(payload ?? {}), timestamp: Date.now() }),
        );
      } catch (error) {
        console.error('Autosave (local backup) failed:', error);
      }
    };

    const performSave = async () => {
      if (typeof window === 'undefined') return;
      const payload = dataRef.current as Record<string, unknown> | null;

      if (!window.navigator.onLine) {
        setSaveStatus('offline');
        writeLocalBackup();
        return;
      }

      setSaveStatus('saving');
      try {
        const res = await fetch('/api/admin/drafts', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ type: collectionName, data: payload ?? {} }),
        });
        if (!res.ok) throw new Error(`draft save failed: ${res.status}`);
        // Mirror to localStorage so recovery works even if the server is later
        // unreachable (offline / session expired).
        writeLocalBackup();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch {
        // Network/server failure: keep the local backup so recovery still works.
        writeLocalBackup();
        setSaveStatus('error');
      }
    };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(performSave, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, enabled, collectionName, docId, delay, storageKey]);

  return { saveStatus };
}

/**
 * Load the authenticated admin's server-backed draft for a type. Returns the
 * draft data + updatedAt, or null when none exists / the request fails (so the
 * caller falls back to localStorage recovery). Used by the new-blog / new-job
 * pages to restore a draft across refreshes + devices.
 */
export async function loadServerDraft(
  type: 'jobs' | 'blogPosts' | 'drafts',
): Promise<{ data: Record<string, unknown>; updatedAt: string | null } | null> {
  try {
    const res = await fetch(`/api/admin/drafts?type=${encodeURIComponent(type)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      draft?: { data?: Record<string, unknown>; updatedAt?: string | null };
    };
    if (!json.draft || !json.draft.data) return null;
    return { data: json.draft.data, updatedAt: json.draft.updatedAt ?? null };
  } catch {
    return null;
  }
}
