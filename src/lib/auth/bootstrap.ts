/**
 * bootstrap.ts — one-time Super Admin bootstrap (Part D).
 *
 * Configured bootstrap identity: SUPERADMIN_BOOTSTRAP_EMAIL env
 * (contact@prabhat.online). NO public Super Admin registration.
 *
 * Flow (server-side, two steps):
 *   1. requestBootstrapOtp — only if NO super_admin exists yet. Issues an SMTP
 *      OTP (purpose 'bootstrap') to the configured email. Returns the signed
 *      otpRequestId (the code is emailed, never returned to the client).
 *   2. completeBootstrap — verifies the OTP, then in a Firestore TRANSACTION
 *      re-checks that no super_admin exists + the sentinel `bootstrap/state` is
 *      not `completed`. If clear, creates `admins/{email}` with role
 *      super_admin, status active, passwordHash (set here, after verification),
 *      tokenVersion, emailVerified:true, and marks `bootstrap/state.completed`.
 *      Concurrency-safe: the transaction guarantees exactly one creator.
 *
 * Once complete, both steps return `{ available: false }` — bootstrap is
 * disabled. No hardcoded password. No bootstrap/OTP secret reaches the client.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { issueOtp, verifyOtp, type OtpPurpose } from './otp';
import { hashPassword, validatePassword, passwordPolicyMessage } from './password';
import { logSecurityEvent } from './security-events';
import { POLICIES, checkRateLimit } from './rate-limit';

/** The configured bootstrap email (server env). Null if not configured. */
export function getBootstrapEmail(): string | null {
  const e = process.env.SUPERADMIN_BOOTSTRAP_EMAIL;
  if (!e || !e.includes('@')) return null;
  return e.toLowerCase().trim();
}

const BOOTSTRAP_PURPOSE: OtpPurpose = 'bootstrap';

/** Mask an email for logs/UI without exposing the full address. */
function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}••••@${d}`;
}

export interface BootstrapAvailability {
  available: boolean;
  /** masked bootstrap email, for UI display when available. */
  maskedEmail?: string;
  reason?: 'already_complete' | 'not_configured' | 'unavailable';
}

/** True iff no super_admin exists yet AND bootstrap email is configured. */
export async function checkBootstrapAvailable(): Promise<BootstrapAvailability> {
  const db = getAdminDb();
  const email = getBootstrapEmail();
  if (!email) return { available: false, reason: 'not_configured' };
  if (!db) return { available: false, reason: 'unavailable' };
  const existing = await db.collection('admins').where('role', '==', 'super_admin').limit(1).get();
  if (!existing.empty) return { available: false, reason: 'already_complete' };
  return { available: true, maskedEmail: maskEmail(email) };
}

export interface BootstrapOtpResult {
  ok: boolean;
  otpRequestId?: string;
  maskedEmail?: string;
  reason?: 'already_complete' | 'not_configured' | 'rate_limited' | 'unavailable' | 'smtp_not_configured' | 'smtp_error';
  retryAfter?: number;
  /** The plaintext code — ONLY for the route to email (and only if SMTP is configured). */
  code?: string;
  /** dev-only mailpit preview, if a dev transport was used. */
  devPreview?: string;
}

/** Step 1: request the bootstrap OTP. No-op (returns already_complete) if done. */
export async function requestBootstrapOtp(ip?: string): Promise<BootstrapOtpResult> {
  const email = getBootstrapEmail();
  if (!email) return { ok: false, reason: 'not_configured' };
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  const avail = await checkBootstrapAvailable();
  if (!avail.available) return { ok: false, reason: avail.reason ?? 'already_complete', maskedEmail: avail.maskedEmail };

  // Dedicated rate limit for bootstrap attempts.
  const rl = await checkRateLimit(`bootstrap:ip:${ip ?? 'unknown'}`, POLICIES.bootstrap);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'bootstrap_attempt', ip, detail: 'rate_limited' });
    return { ok: false, reason: 'rate_limited', retryAfter: rl.retryAfter };
  }

  const issued = await issueOtp({ email, purpose: BOOTSTRAP_PURPOSE, ip });
  if (!issued.ok || !issued.code) {
    return { ok: false, reason: issued.reason === 'rate_limited' ? 'rate_limited' : 'unavailable', retryAfter: issued.retryAfter };
  }

  await logSecurityEvent({ type: 'bootstrap_attempt', email, ip, detail: 'otp_issued' });
  return { ok: true, otpRequestId: issued.otpRequestId, maskedEmail: maskEmail(email), code: issued.code };
}

export interface BootstrapCompleteInput {
  otpRequestId: string;
  code: string;
  newPassword: string;
  ip?: string;
}

export interface BootstrapCompleteResult {
  ok: boolean;
  email?: string;
  reason?: 'already_complete' | 'invalid_otp' | 'weak_password' | 'unavailable' | 'conflict';
  message?: string;
}

/** Step 2: verify OTP + create the Super Admin in a transaction. */
export async function completeBootstrap(input: BootstrapCompleteInput): Promise<BootstrapCompleteResult> {
  const email = getBootstrapEmail();
  if (!email) return { ok: false, reason: 'unavailable', message: 'Bootstrap email not configured.' };
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  // Verify the OTP (single-use, bootstrap purpose).
  const v = await verifyOtp({ otpRequestId: input.otpRequestId, code: input.code, ip: input.ip });
  if (!v.ok || v.email !== email) {
    await logSecurityEvent({ type: 'bootstrap_attempt', email, ip: input.ip, detail: `otp_failed:${v.reason}` });
    return { ok: false, reason: 'invalid_otp', message: 'Invalid or expired verification code.' };
  }

  // Password policy.
  const pwErr = validatePassword(input.newPassword);
  if (pwErr) return { ok: false, reason: 'weak_password', message: passwordPolicyMessage(pwErr) };

  const passwordHash = await hashPassword(input.newPassword);

  // Transaction: guarantee exactly one super_admin is created.
  try {
    const sentinelRef = db.collection('bootstrap').doc('state');
    await db.runTransaction(async (tx) => {
      const sentinelSnap = await tx.get(sentinelRef);
      if (sentinelSnap.exists && sentinelSnap.data()?.completed === true) {
        throw new Error('ALREADY_COMPLETE');
      }
      // double-check no super_admin exists (defense in depth)
      const existing = await tx.get(db.collection('admins').where('role', '==', 'super_admin').limit(1));
      if (!existing.empty) throw new Error('ALREADY_COMPLETE');

      tx.set(db.collection('admins').doc(email), {
        email,
        role: 'super_admin',
        status: 'active',
        passwordHash,
        tokenVersion: Date.now(),
        emailVerified: true,
        createdAt: Timestamp.fromMillis(Date.now()),
        createdBy: 'bootstrap',
      });
      tx.set(sentinelRef, { completed: true, completedAt: Timestamp.fromMillis(Date.now()), email }, { merge: true });
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'ALREADY_COMPLETE') {
      return { ok: false, reason: 'already_complete', message: 'A Super Admin already exists. Bootstrap is disabled.' };
    }
    console.error('[bootstrap] transaction failed:', e instanceof Error ? e.message : e);
    return { ok: false, reason: 'unavailable', message: 'Bootstrap could not complete.' };
  }

  await logSecurityEvent({ type: 'bootstrap_success', email, ip: input.ip, actor: 'bootstrap' });
  return { ok: true, email };
}
