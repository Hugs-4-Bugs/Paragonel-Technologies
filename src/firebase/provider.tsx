'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export function useAuth() {
  return useFirebase().auth;
}

export interface FirebaseProviderProps {
  // Nullable: `initializeFirebase()` returns nulls when the public Firebase
  // env vars are not configured, so the build/runtime never throws on a missing
  // client config. Consumers null-check via the hooks.
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  children: React.ReactNode;
}

export function FirebaseProvider({
  firebaseApp,
  firestore,
  auth,
  children,
}: FirebaseProviderProps) {
  const value = useMemo(
    () => ({
      firebaseApp,
      firestore,
      auth,
    }),
    [firebaseApp, firestore, auth]
  );

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}
