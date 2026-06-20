'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';

interface AutosaveOptions {
  db: Firestore | null;
  collectionName: 'jobs' | 'blogPosts' | 'drafts';
  docId: string | null;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export function useAutosave({ db, collectionName, docId, data, delay = 30000, enabled = true }: AutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !db || !docId) return;

    const performSave = async () => {
      if (!window.navigator.onLine) {
        setSaveStatus('offline');
        localStorage.setItem(`offline_draft_${collectionName}_${docId}`, JSON.stringify({
          ...dataRef.current,
          timestamp: Date.now()
        }));
        return;
      }

      setSaveStatus('saving');
      try {
        const draftRef = doc(db, 'drafts', `${collectionName}_${docId}`);
        await setDoc(draftRef, {
          entityId: docId,
          type: collectionName,
          data: dataRef.current,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // Backup to localStorage
        localStorage.setItem(`last_sync_${collectionName}_${docId}`, JSON.stringify({
          ...dataRef.current,
          timestamp: Date.now()
        }));

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
  }, [data, enabled, db, collectionName, docId, delay]);

  return { saveStatus };
}
