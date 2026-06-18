'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';

interface AutosaveOptions {
  db: Firestore | null;
  collectionName: string;
  docId: string | null;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export function useAutosave({ db, collectionName, docId, data, delay = 30000, enabled = true }: AutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !db || !docId) return;

    const performSave = async () => {
      setSaveStatus('saving');
      try {
        const draftRef = doc(db, collectionName, docId);
        await setDoc(draftRef, {
          ...dataRef.current,
          updatedAt: serverTimestamp(),
          isDraft: true,
        }, { merge: true });

        // Also save to localStorage as backup
        localStorage.setItem(`draft_${collectionName}_${docId}`, JSON.stringify({
          ...dataRef.current,
          timestamp: Date.now()
        }));

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
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
