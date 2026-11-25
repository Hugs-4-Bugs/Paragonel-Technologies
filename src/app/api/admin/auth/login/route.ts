/**
 * POST /api/admin/auth/login — admin login STEP 1 (Part B/D).
 *
 * Replaces the old password-only login. Verifies the admin's email + password
 * against the `admins/{email}` Firestore doc (created by bootstrap or
 * invitation), checks `status === 'active'`, and — on success — issues a
 * short-lived step-1 token + an SMTP OTP (purpose 'admin_login') to the admin's
 * email. The caller then completes step 2 at /api/admin/auth/otp/verify.
 *
 * Password alone is NOT sufficient for admin access (Part B requirement).
 * Uniform "Invalid credentials" for any failure (no enumeration). Rate-limited.
 *
 * NOTE: the legacy env-based single-admin (ADMIN_EMAIL/ADMIN_PASSWORD_HASH) is
 * superseded by the `admins/` collection. Bootstrap creates the first admin.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPassword } from '@/lib/auth/password';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { issueAdminStep1Token } from '@/lib/auth/admin-step1';
import { POLICIES, checkBoth, recordFailure, clearFailures } from '@/lib/auth/rate-limit';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const email = (body.email ?? '').toLowerCase().trim();
  const password = body.password ?? '';
  if (!EMAIL_RE.test(email) || !password) return jsonError(401, 'Invalid credentials.');

  const rl = await checkBoth('adminLogin', POLICIES.login, email, ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', email, ip, detail: 'admin login' });
    return jsonError(429, 'Too many attempts. Try again later.', { retryAfter: rl.retryAfter });
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('admins').doc(email).get();
  const data = snap.exists ? snap.data() as { passwordHash?: string; status?: string; role?: string } : null;
  const ok = data?.passwordHash ? await verifyPassword(password, data.passwordHash) : false;

  if (!ok || !data || data.status !== 'active') {
    await recordFailure(`adminLogin:email:${email}`, POLICIES.login, { email, ip, event: 'admin_login' });
    await recordFailure(`adminLogin:ip:${ip ?? 'unknown'}`, POLICIES.login, { email, ip, event: 'admin_login' });
    await logSecurityEvent({ type: 'login_failed', email, ip, detail: 'admin' });
    return jsonError(401, 'Invalid credentials.');
  }

  clearFailures('adminLogin', email, ip);

  // Issue the step-1 token (password verified). Step 2 completes at
  // /api/admin/auth/otp/verify.
  const step1Token = issueAdminStep1Token(email);
  if (!step1Token) return jsonError(500, 'Server auth misconfigured (OTP_SECRET).');

  // MFA branch (Phase 3): if the admin has TOTP enrolled, step 2 requires an
  // authenticator-app code (or a backup code) — NOT an email OTP. The
  // otp/verify route reads the admin doc + validates the TOTP code. No email
  // OTP is issued: the authenticator is the second factor.
  const mfaEnabled = !!((data as { mfa?: { enabled?: boolean } }).mfa?.enabled);
  if (mfaEnabled) {
    await logSecurityEvent({ type: 'login_success', email, ip, detail: 'admin step1 (mfa)' });
    return NextResponse.json({
      step: 1,
      step1Token,
      mfaRequired: true,
      message: 'Password accepted. Enter the 6-digit code from your authenticator app.',
    });
  }

  // No MFA: email-OTP second factor (the first-login path before TOTP
  // enrollment, + the fallback for admin/editor/viewer roles not enrolled).
  const issued = await issueOtp({ email, purpose: 'admin_login', ip });
  if (!issued.ok || !issued.code || !issued.otpRequestId) {
    return jsonError(429, 'Too many code requests. Wait a moment and try again.', { retryAfter: issued.retryAfter ?? 60 });
  }
  const sent = await deliverOtp(email, issued.code, 'admin_login');

  await logSecurityEvent({ type: 'login_success', email, ip, detail: 'admin step1' });

  return NextResponse.json({
    step: 1,
    step1Token,
    otpRequestId: issued.otpRequestId,
    message: 'Password accepted. Enter the verification code sent to your email.',
    emailDelivered: sent.sent,
    emailDeliveryNote: !sent.sent
      ? (sent.devLogged
        ? 'SMTP not configured — code printed to the server console (dev only).'
        : 'SMTP not configured — delivery cannot be verified until credentials are supplied.')
      : undefined,
  });
}
