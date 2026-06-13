
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp;
let db: Firestore;

// Ensure Firebase is initialized correctly on both server (for SSR compatibility) and client
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Error initializing Firebase App:", e);
  }
} else {
  app = getApp();
}

// @ts-ignore
db = getFirestore(app);

export { app, db };
