'use client';

import { useEffect, useRef, useState } from 'react';

interface AutosaveOptions {
  /**
   * Retained for backward compatibility with callers that previously passed a
   * Firestore instance. The autosave is now localStorage-only: the prior
   * client-SDK `setDoc` to the `drafts` collection was denied by the
   * default-deny Firestore rules (it silently failed on every call) and has
   * been removed. The localStorage backup — which was always the actual working
   * path — is preserved, so the autosave capability + the `saveStatus` contract
   * are unchanged. `db` is accepted but ignored.
   */
  db?: unknown;
  collectionName: 'jobs' | 'blogPosts' | 'drafts';
  docId: string | null;
  data: unknown;
  delay?: number;
  enabled?: boolean;
}

/**
 * Debounced autosave to localStorage. Replaces the previous implementation that
 * attempted a direct client Firestore write to `drafts` (denied by the
 * default-deny rules). The save status contract ('idle' | 'saving' | 'saved' |
 * 'error' | 'offline') is preserved so callers need no changes.
 */
export function useAutosave({
  collectionName,
  docId,
  data,
  delay = 30000,
  enabled = true,
}: AutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !docId) return;

    const performSave = () => {
      const payload = dataRef.current as Record<string, unknown> | null;
      if (typeof window === 'undefined') return;

      if (!window.navigator.onLine) {
        setSaveStatus('offline');
        try {
          localStorage.setItem(
            `offline_draft_${collectionName}_${docId}`,
            JSON.stringify({ ...(payload ?? {}), timestamp: Date.now() }),
          );
        } catch (error) {
          console.error('Autosave (offline backup) failed:', error);
        }
        return;
      }

      setSaveStatus('saving');
      try {
        localStorage.setItem(
          `last_sync_${collectionName}_${docId}`,
          JSON.stringify({ ...(payload ?? {}), timestamp: Date.now() }),
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        console.error('Autosave failed:', error);
        setSaveStatus('error');
      }
    };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(performSave, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, enabled, collectionName, docId, delay]);

  return { saveStatus };
}
