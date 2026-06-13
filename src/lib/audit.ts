
'use client';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function logActivity(adminEmail: string, action: string, resourceType: string, resourceId: string) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'adminActivityLogs'), {
      adminEmail,
      action,
      resourceType,
      resourceId,
      timestamp: serverTimestamp(),
      // IP address capture would typically happen on server, placeholder here
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
