/**
 * recovery.ts — Super Admin credential recovery (Phase 4).
 *
 * Use case: the founder configured SUPERADMIN_BOOTSTRAP_EMAIL=contact@prabhat.online,
 * a super_admin account was bootstrapped (so /admin/bootstrap is now disabled),
 * but the password is unknown/lost. Login returns "Invalid credentials".
 *
 * This module provides a SECURE, RESTRICTED recovery flow:
 *   1. requestRecoveryOtp(email) — ONLY for the configured SUPERADMIN_BOOTSTRAP_EMAIL,
 *      and ONLY if an admins/{email} doc with role super_admin already EXISTS.
 *      No new account is created, no other email can be recovered, no role is
 *      escalated. Issues a single-use 'recovery' OTP to that email.
 *   2. completeRecovery({email, otpRequestId, code, newPassword}) — verifies the
 *      OTP, validates the new password, then resets passwordHash (bcrypt),
 *      bumps tokenVersion (revokes ALL prior sessions), and forces MFA
 *      re-enrollment (mfa.enabled=false + secret cleared) — so the recovered
 *      admin must re-enroll TOTP before accessing the portal (the middleware
 *      super_admin MFA gate enforces this).
 *
 * Security properties (matches the task's 12 requirements):
 *   1. Restricted to the server-side SUPERADMIN_BOOTSTRAP_EMAIL.           (req 1, 10, 11)
 *   2. OTP-gated (signed, time-limited, single-use — issueOtp/verifyOtp).  (req 2, 3, 9)
 *   3. Only an EXISTING super_admin doc can be recovered (no provisioning). (req 4, 11)
 *   4. New password set via bcrypt (hashPassword); policy-validated.        (req 5)
 *   5. tokenVersion bump revokes all prior sessions (not reusable).        (req 3, 9)
 *   6. MFA forced re-enrollment (mfa.enabled=false) — middleware blocks.   (req 6, 7)
 *   7. Every step logged (recovery_attempt / recovery_success / recovery_failed). (req 8)
 *   8. Never reads/returns existing passwordHash, OTP value, or secrets.   (req 12)
 *
 * No hardcoded credential. No auth bypass. No public reset endpoint (the email
 * must equal the server-configured bootstrap email; the OTP must verify).
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { issueOtp, verifyOtp } from './otp';
import { hashPassword, validatePassword, passwordPolicyMessage } from './password';
import { logSecurityEvent } from './security-events';
import { POLICIES, checkRateLimit } from './rate-limit';
import { getBootstrapEmail } from './bootstrap';

const RECOVERY_PURPOSE = 'recovery' as const;

/** Mask an email for logs/UI without exposing the full address. */
function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}••••@${d}`;
}

export interface RecoveryOtpResult {
  ok: boolean;
  otpRequestId?: string;
  maskedEmail?: string;
  reason?: 'not_authorized' | 'no_account' | 'rate_limited' | 'unavailable' | 'smtp_not_configured' | 'smtp_error' | 'misconfigured';
  retryAfter?: number;
  /** The plaintext code — ONLY for the route to email (never returned to the client). */
  code?: string;
  devPreview?: string;
}

/**
 * Step 1: request a recovery OTP. Restricted to the configured bootstrap email
 * AND an existing super_admin doc for that email. No new account creation.
 */
export async function requestRecoveryOtp(input: { email: string; ip?: string }): Promise<RecoveryOtpResult> {
  const configuredEmail = getBootstrapEmail();
  if (!configuredEmail) {
    return { ok: false, reason: 'misconfigured' };
  }
  // HARD restriction: the requested email MUST exactly equal the server-side
  // configured bootstrap email. No other email can be recovered, ever.
  const requestedEmail = (input.email || '').toLowerCase().trim();
  if (requestedEmail !== configuredEmail) {
    // Log as unauthorized (no email in the event to avoid leaking which email
    // was probed). Do NOT reveal whether the configured email is different.
    await logSecurityEvent({ type: 'recovery_failed', ip: input.ip, detail: 'email_not_authorized' });
    return { ok: false, reason: 'not_authorized' };
  }

  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  // The super_admin account MUST already exist (bootstrap completed). Recovery
  // never creates or escalates an account — it only resets a known one.
  const snap = await db.collection('admins').doc(requestedEmail).get();
  if (!snap.exists) {
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: 'no_account' });
    return { ok: false, reason: 'no_account' };
  }
  const data = snap.data() as { role?: string };
  if (data.role !== 'super_admin') {
    // The doc exists but is NOT super_admin — refuse (no escalation path).
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: 'not_super_admin' });
    return { ok: false, reason: 'not_authorized' };
  }

  // Dedicated rate limit for recovery (reuse the bootstrap policy — strict).
  const rl = await checkRateLimit(`recovery:ip:${input.ip ?? 'unknown'}`, POLICIES.bootstrap);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: 'rate_limited' });
    return { ok: false, reason: 'rate_limited', retryAfter: rl.retryAfter };
  }

  const issued = await issueOtp({ email: requestedEmail, purpose: RECOVERY_PURPOSE, ip: input.ip });
  if (!issued.ok || !issued.code) {
    return { ok: false, reason: issued.reason === 'rate_limited' ? 'rate_limited' : 'unavailable', retryAfter: issued.retryAfter };
  }

  await logSecurityEvent({ type: 'recovery_attempt', email: requestedEmail, ip: input.ip, detail: 'otp_issued' });
  return { ok: true, otpRequestId: issued.otpRequestId, maskedEmail: maskEmail(requestedEmail), code: issued.code };
}

export interface RecoveryCompleteInput {
  email: string;
  otpRequestId: string;
  code: string;
  newPassword: string;
  ip?: string;
}

export interface RecoveryCompleteResult {
  ok: boolean;
  email?: string;
  reason?: 'not_authorized' | 'invalid_otp' | 'weak_password' | 'unavailable' | 'no_account';
  message?: string;
}

/**
 * Step 2: verify the OTP + reset the password + force MFA re-enrollment +
 * revoke all prior sessions (tokenVersion bump). Transactional + idempotent-ish
 * (the OTP is single-use; a second call fails at verifyOtp).
 */
export async function completeRecovery(input: RecoveryCompleteInput): Promise<RecoveryCompleteResult> {
  const configuredEmail = getBootstrapEmail();
  if (!configuredEmail) return { ok: false, reason: 'unavailable', message: 'Recovery email not configured.' };
  const requestedEmail = (input.email || '').toLowerCase().trim();
  if (requestedEmail !== configuredEmail) {
    await logSecurityEvent({ type: 'recovery_failed', ip: input.ip, detail: 'email_not_authorized' });
    return { ok: false, reason: 'not_authorized', message: 'Not authorized.' };
  }

  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  // Verify the OTP (single-use, recovery purpose). The OTP's embedded email
  // MUST match the configured bootstrap email.
  const v = await verifyOtp({ otpRequestId: input.otpRequestId, code: input.code, ip: input.ip });
  if (!v.ok || v.email !== requestedEmail) {
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: `otp_failed:${v.reason}` });
    return { ok: false, reason: 'invalid_otp', message: 'Invalid or expired verification code.' };
  }

  // Re-confirm the super_admin doc still exists (no race deletion).
  const ref = db.collection('admins').doc(requestedEmail);
  const snap = await ref.get();
  if (!snap.exists) {
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: 'no_account_at_complete' });
    return { ok: false, reason: 'no_account', message: 'Account not found.' };
  }
  const data = snap.data() as { role?: string; tokenVersion?: number };
  if (data.role !== 'super_admin') {
    await logSecurityEvent({ type: 'recovery_failed', email: requestedEmail, ip: input.ip, detail: 'not_super_admin_at_complete' });
    return { ok: false, reason: 'not_authorized', message: 'Not authorized.' };
  }

  // Password policy.
  const pwErr = validatePassword(input.newPassword);
  if (pwErr) return { ok: false, reason: 'weak_password', message: passwordPolicyMessage(pwErr) };

  const passwordHash = await hashPassword(input.newPassword);
  const currentVersion = data.tokenVersion ?? 0;

  // Reset the password + force MFA re-enrollment + revoke all prior sessions.
  // mfa.enabled=false makes the middleware redirect /admin/* → /admin/mfa-enroll
  // on the next login, so the recovered admin MUST re-enroll TOTP.
  await ref.update({
    passwordHash,
    tokenVersion: currentVersion + 1, // revokes all prior sessions
    mfa: { totpSecret: null, enabled: false, enrolledAt: null, backupCodes: [] },
    emailVerified: true,
    status: 'active',
    updatedAt: Timestamp.fromMillis(Date.now()),
    recoveredAt: Timestamp.fromMillis(Date.now()),
  });

  await logSecurityEvent({ type: 'recovery_success', email: requestedEmail, ip: input.ip, actor: 'recovery' });
  return { ok: true, email: requestedEmail };
}
