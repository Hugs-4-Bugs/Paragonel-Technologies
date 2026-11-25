'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';
import { redactReason } from '@/lib/job-alerts/dedup';

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  if (app) {
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (e) {
  console.error("Error initializing Firebase:", redactReason(e));
}

export { app, db, storage };
