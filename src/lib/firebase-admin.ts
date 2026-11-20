/**
 * Server-side Firebase Admin SDK (Phase 1B).
 *
 * This module is the ONLY path by which the app writes to Firestore/Storage from
 * server code. Browser code must NOT write directly — all public submissions go
 * through Next.js API routes that use this module.
 *
 * Credential handling (NEVER invent service-account credentials):
 *   - LOCAL / EMULATOR mode: when FIRESTORE_EMULATOR_HOST is set, the Admin SDK
 *     connects to the local Firestore emulator with NO real credentials. The
 *     emulator does not authenticate. This is how all local testing runs.
 *   - PRODUCTION mode: requires FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL
 *     + FIREBASE_ADMIN_PRIVATE_KEY. If any are missing, getAdminDb()/getAdminBucket()
 *     return null and API routes MUST respond 503 (service unavailable) instead of
 *     writing. No production write is ever attempted without real credentials.
 *
 * Production isolation is therefore env-driven: set FIRESTORE_EMULATOR_HOST locally,
 * leave it unset in production (where real service-account creds are required).
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let adminInitError: string | null = null;

function isEmulatorMode(): boolean {
  return !!process.env.FIRESTORE_EMULATOR_HOST;
}

function initAdmin(): App | null {
  if (adminApp) return adminApp;
  if (adminInitError) return null;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Emulator: no credentials required. projectId is used only for namespacing.
  // storageBucket is required by the Admin Storage SDK even against the
  // emulator (otherwise bucket.file() throws "Bucket name not specified").
  if (isEmulatorMode()) {
    adminApp = initializeApp({
      projectId: projectId || 'paragonel-dev',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    });
    return adminApp;
  }

  // Production: real service-account credentials required.
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  // Support keys stored with literal "\n" (common in .env files).
  const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    adminInitError =
      'Firebase Admin SDK not configured for production: FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY are required.';
    // Do NOT throw here — callers must be able to start the app and respond 503.
    console.warn(`[firebase-admin] ${adminInitError}`);
    return null;
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return adminApp;
}

/** Returns the Admin Firestore instance, or null if not configured (production w/o creds). */
export function getAdminDb(): Firestore | null {
  const app = initAdmin();
  if (!app) return null;
  return getFirestore(app);
}

/** Returns the Admin Storage instance, or null if not configured. */
export function getAdminBucket(): Storage | null {
  const app = initAdmin();
  if (!app) return null;
  const storage = getStorage(app);
  return storage;
}

export function isAdminConfigured(): boolean {
  return initAdmin() !== null;
}

export function adminStatus(): {
  configured: boolean;
  emulator: boolean;
  error: string | null;
} {
  return {
    configured: isAdminConfigured(),
    emulator: isEmulatorMode(),
    error: adminInitError,
  };
}
