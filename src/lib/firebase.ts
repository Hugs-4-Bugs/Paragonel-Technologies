'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp;
let db: Firestore;

try {
  // Ensure Firebase is initialized correctly on both server (for SSR compatibility) and client
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  if (app) {
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

// @ts-ignore - Handle cases where db might not be initialized yet
export { app, db };