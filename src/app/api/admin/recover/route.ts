/**
 * POST /api/admin/recover — Super Admin credential recovery (Phase 4).
 *
 * Two-step flow (mirrors /api/admin/bootstrap):
 *   POST {action:'request_otp', email}     → email a recovery OTP to the
 *                                              configured SUPERADMIN_BOOTSTRAP_EMAIL
 *                                              (ONLY if a super_admin doc exists
 *                                              for that email; no provisioning).
 *   POST {action:'complete', email, otpRequestId, code, newPassword}
 *                                          → verify OTP + reset password + force
 *                                              MFA re-enrollment + revoke prior
 *                                              sessions.
 *
 * Security: see src/lib/auth/recovery.ts. The endpoint is NOT behind the admin
 * session gate (it can't be — the admin can't log in). It is restricted by:
 *   - email MUST equal the server-side SUPERADMIN_BOOTSTRAP_EMAIL.
 *   - a single-use, time-limited OTP (issueOtp/verifyOtp, OTP_SECRET-signed).
 *   - a strict rate limit (POLICIES.bootstrap).
 *   - only an EXISTING super_admin doc can be recovered (no escalation).
 * No OTP secret, password hash, or session token reaches the client.
 */
import { NextResponse } from 'next/server';
import { requestRecoveryOtp, completeRecovery } from '@/lib/auth/recovery';
import { deliverOtp } from '@/lib/auth/email';
import { getBootstrapEmail } from '@/lib/auth/bootstrap';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Public availability check — reveals ONLY whether recovery is configured
  // (bootstrap email set) + the masked email. Never reveals whether an account
  // exists (that's checked at request_otp time, with a uniform message).
  const email = getBootstrapEmail();
  if (!email) return jsonError(503, 'Recovery is not configured (SUPERADMIN_BOOTSTRAP_EMAIL not set).');
  const masked = `${email.slice(0, 2)}••••@${email.split('@')[1]}`;
  return NextResponse.json({
    available: true,
    maskedEmail: masked,
    message: 'Super Admin recovery is available. Enter the configured email + request a verification code.',
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { action?: string; email?: string; otpRequestId?: string; code?: string; newPassword?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { action } = body;

  if (action === 'request_otp') {
    const r = await requestRecoveryOtp({ email: body.email ?? '', ip });
    if (!r.ok) {
      // Uniform message for not_authorized / no_account to avoid enumeration.
      const status = r.reason === 'rate_limited' ? 429 : r.reason === 'misconfigured' ? 503 : 400;
      const msg =
        r.reason === 'rate_limited' ? 'Too many attempts. Try again later.' :
        r.reason === 'misconfigured' ? 'Recovery is not configured.' :
        r.reason === 'unavailable' ? 'Recovery is temporarily unavailable.' :
        'If that email is the configured Super Admin, a verification code has been sent.';
      return NextResponse.json({ available: false, reason: r.reason, retryAfter: r.retryAfter, message: msg }, { status });
    }
    // Email the code (deliverOtp includes the dev-console fallback).
    if (r.code) await deliverOtp(getBootstrapEmail()!, r.code, 'recovery');
    return NextResponse.json({
      available: true,
      otpRequestId: r.otpRequestId,
      maskedEmail: r.maskedEmail,
      message: 'A verification code has been sent to the configured Super Admin email.',
    });
  }

  if (action === 'complete') {
    const { email, otpRequestId, code, newPassword } = body;
    if (!email || !otpRequestId || !code || !newPassword) {
      return jsonError(400, 'Missing email, code, or new password.');
    }
    const r = await completeRecovery({ email, otpRequestId, code: String(code), newPassword, ip });
    if (!r.ok) {
      const status = r.reason === 'weak_password' ? 400 : r.reason === 'invalid_otp' ? 400 : r.reason === 'no_account' ? 404 : 503;
      return jsonError(status, r.message ?? 'Recovery failed.', { reason: r.reason });
    }
    return NextResponse.json({
      ok: true,
      email: r.email,
      message: 'Super Admin password reset. MFA must be re-enrolled. You can now log in.',
    });
  }

  return jsonError(400, "Unknown action. Use 'request_otp' or 'complete'.");
}
