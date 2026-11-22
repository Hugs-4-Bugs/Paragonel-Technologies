'use client';

// Firebase web config is sourced from NEXT_PUBLIC_* env vars (public-by-design,
// but no longer hardcoded in source). Copy .env.example to .env and fill in.
//
// IMPORTANT: each env var MUST be read as a STATIC `process.env.NEXT_PUBLIC_...`
// reference (passed by value), NOT via a dynamic `process.env[name]` lookup.
// Next.js inlines NEXT_PUBLIC_* into the client bundle at COMPILE time only for
// static accesses; a dynamic access is not inlined and resolves to `undefined`
// in the browser.
//
// BUILD ROBUSTNESS (Prompt 04): this module MUST NOT throw at module load. An
// earlier version threw when a var was missing, which broke `next build`
// prerender of pages whose layout transitively imports the client SDK (notably
// /_not-found) whenever the public Firebase env vars were absent in the build
// environment. Now it falls back to an empty string + exports
// `isFirebaseConfigured`; `src/firebase/index.ts` guards initialization so an
// unconfigured client SDK is a no-op (null app/firestore/auth) at runtime
// instead of failing the build. Public pages already render from server-side
// data (Admin SDK via public-data), so a missing client config never blanks a
// page.
function envOrEmpty(name: string, value: string | undefined): string {
  return value && value.trim() !== '' ? value : '';
}

export const firebaseConfig = {
  apiKey: envOrEmpty('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: envOrEmpty('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: envOrEmpty('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: envOrEmpty('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: envOrEmpty('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: envOrEmpty('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
};

/** True when the minimum set of public Firebase env vars is present. */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
