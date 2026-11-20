'use client';

// Firebase web config is sourced from NEXT_PUBLIC_* env vars (public-by-design,
// but no longer hardcoded in source). Copy .env.example to .env and fill in.
//
// IMPORTANT: each env var MUST be read as a STATIC `process.env.NEXT_PUBLIC_...`
// reference (passed by value to the validator), NOT via a dynamic
// `process.env[name]` lookup. Next.js inlines NEXT_PUBLIC_* into the client
// bundle at COMPILE time only for static accesses; a dynamic access is not
// inlined and resolves to `undefined` in the browser, which triggers
// "Missing required Firebase env var" even when .env holds valid values.
function requireFirebaseEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required Firebase env var "${name}". Copy .env.example to .env and provide a value.`
    );
  }
  return value;
}

export const firebaseConfig = {
  apiKey: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
};
