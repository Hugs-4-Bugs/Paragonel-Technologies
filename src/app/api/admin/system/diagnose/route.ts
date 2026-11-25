/**
 * GET /api/admin/system/diagnose — comprehensive server-side environment + service
 * diagnostic (Phase 2/5).
 *
 * Returns, for EVERY server-side env var the Super Admin recovery/login +
 * Paragonel AI flows depend on, a boolean presence check (NEVER the value) +
 * a plain-English readiness summary. This lets the founder verify, after
 * recovering the Super Admin account, exactly which variables are missing or
 * misconfigured — without exposing any secret value.
 *
 * Security:
 *   - Admin-only (verifyAdminPermission 'security.audit.read' — super_admin/admin).
 *   - Presence-only (typeof + trim().length). The VALUE is never read into the
 *     response, never logged, never compared beyond emptiness.
 *   - No NEXT_PUBLIC_ AI keys (verified: GOOGLE_API_KEY etc. are server-only).
 *
 * The response is intentionally a stable, machine-readable structure so the
 * founder can diff it against the required-vars table in the report.
 */
import { NextResponse } from 'next/server';
import { verifyAdminPermission } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getBootstrapEmail } from '@/lib/auth/bootstrap';
import { getOtpSecret } from '@/lib/auth/otp';
import { isSmtpConfigured } from '@/lib/auth/email';
import { hasGeminiKey, GEMINI_MODEL_ID, GEMINI_MODEL_REF } from '@/ai/models';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Boolean presence for a single env var (never the value). */
function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'security.audit.read');
  if (!auth.ok) return auth.response;

  // ---- Super Admin recovery + login dependencies ----
  const superAdmin = {
    SUPERADMIN_BOOTSTRAP_EMAIL: (() => {
      const e = getBootstrapEmail();
      return e ? { present: true, masked: `${e.slice(0, 2)}••••@${e.split('@')[1]}` } : { present: false };
    })(),
    JWT_SECRET: (() => {
      const v = process.env.JWT_SECRET;
      return { present: typeof v === 'string' && v.length >= 32 };
    })(),
    OTP_SECRET: (() => {
      const v = getOtpSecret();
      return { present: !!v };
    })(),
    FIREBASE_ADMIN: {
      FIREBASE_ADMIN_PROJECT_ID: present('FIREBASE_ADMIN_PROJECT_ID'),
      FIREBASE_ADMIN_CLIENT_EMAIL: present('FIREBASE_ADMIN_CLIENT_EMAIL'),
      FIREBASE_ADMIN_PRIVATE_KEY: present('FIREBASE_ADMIN_PRIVATE_KEY'),
      // Runtime reachability — getAdminDb() returns a Firestore instance when
      // the Admin SDK initialized (present ≠ reachable; this confirms init worked).
      adminSdkInitialized: !!getAdminDb(),
    },
    SMTP: {
      configured: isSmtpConfigured(),
      SMTP_HOST: present('SMTP_HOST'),
      SMTP_USER: present('SMTP_USER'),
      SMTP_PASS: present('SMTP_PASS'),
      SMTP_FROM: present('SMTP_FROM'),
    },
  };

  // ---- Paragonel AI (chatbot) dependencies ----
  const chatbot = {
    provider: 'googleai',
    modelId: GEMINI_MODEL_ID,
    modelRef: GEMINI_MODEL_REF,
    keyPresent: hasGeminiKey(), // boolean only — never the value
    envVarPresence: {
      GEMINI_API_KEY: present('GEMINI_API_KEY'),
      GOOGLE_API_KEY: present('GOOGLE_API_KEY'),
      GOOGLE_GENAI_API_KEY: present('GOOGLE_GENAI_API_KEY'),
    },
    GEMINI_MODEL_override: present('GEMINI_MODEL'),
    GEMINI_REQUEST_TIMEOUT_MS: present('GEMINI_REQUEST_TIMEOUT_MS'),
  };

  // ---- Plain-English readiness summary ----
  const blockers: string[] = [];
  if (!superAdmin.SUPERADMIN_BOOTSTRAP_EMAIL.present) blockers.push('SUPERADMIN_BOOTSTRAP_EMAIL is not set — bootstrap + recovery are disabled.');
  if (!superAdmin.JWT_SECRET.present) blockers.push('JWT_SECRET is missing or shorter than 32 chars — login sessions cannot be signed.');
  if (!superAdmin.OTP_SECRET.present) blockers.push('OTP_SECRET is missing or shorter than 32 chars — recovery/login OTPs cannot be issued.');
  if (!superAdmin.FIREBASE_ADMIN.adminSdkInitialized) blockers.push('FIREBASE_ADMIN_* incomplete — the Admin SDK did not initialize (admins collection unreachable).');
  if (!superAdmin.SMTP.configured) blockers.push('SMTP_* incomplete — recovery/login OTPs + notifications cannot be emailed.');
  if (!chatbot.keyPresent) blockers.push('No Gemini API key (GEMINI_API_KEY / GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY all empty) — chatbot returns missing_key 503.');
  // NOTE: a live provider call is NOT made here (use POST /api/admin/chatbot/diagnose for that).
  // keyPresent=true does NOT guarantee the key value is valid or has quota.

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    superAdmin,
    chatbot,
    blockers,
    ready: blockers.length === 0,
    note: 'Presence-only checks. A "true" means the variable is set + non-empty (or the Admin SDK initialized) — NOT that the value is valid. For the chatbot, run POST /api/admin/chatbot/diagnose to make a live provider call + verify the key value + model access. No secret values are ever returned.',
  });
}
