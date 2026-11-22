'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

export type FirebaseInit = { app: FirebaseApp | null; firestore: Firestore | null; auth: Auth | null };

/**
 * Initialize the Firebase CLIENT SDK lazily + fail-safe.
 *
 * If the public Firebase env vars are not configured (`isFirebaseConfigured ===
 * false`), this returns `{ app: null, firestore: null, auth: null }` instead of
 * throwing — so `next build` prerender (notably /_not-found, whose layout
 * transitively imports this) never fails when the build environment lacks the
 * client config. Any runtime caller that needs the SDK must null-check (the
 * hooks in `firestore/use-collection`, `firestore/use-doc`, `auth/use-user`
 * already short-circuit on a null auth/firestore).
 *
 * If configured, initialization errors are caught + logged (same as before).
 */
export function initializeFirebase(): FirebaseInit {
  if (!isFirebaseConfigured) {
    return { app: null, firestore: null, auth: null };
  }
  try {
    const { getFirestore } = require('firebase/firestore');
    const { getAuth } = require('firebase/auth');
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { app, firestore, auth };
  } catch (e) {
    console.error('Error initializing Firebase client SDK:', e);
    return { app: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
