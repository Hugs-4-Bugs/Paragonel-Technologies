/**
 * POST /api/auth/otp/verify — verify an OTP and advance the flow (Prompt 05Q §2 Step C).
 *
 * Single-use: the OTP record is consumed on success (handled in otp.verifyOtp).
 * For 'register' → returns a short-lived verificationToken that
 *   /api/auth/register/complete consumes to create the account + set password.
 *   (Prompt 05Q: NO account exists before this token is consumed + the password
 *   is set. This route does NOT touch the users doc for register.)
 * For 'password_reset' → returns a short-lived verificationToken the
 *   /api/auth/reset-password route consumes to set a new password.
 *
 * Never returns the OTP code. Uniform failure messages to avoid leaking state.
 */
import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth/otp';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { otpRequestId?: string; code?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { otpRequestId, code } = body;
  if (!otpRequestId || !code) return jsonError(400, 'Missing verification code.');

  const v = await verifyOtp({ otpRequestId, code: String(code), ip });
  if (!v.ok || !v.email) {
    // Uniform message — never reveal whether the request id or the code was wrong.
    return jsonError(400, 'Invalid or expired verification code.', { reason: v.reason, retryAfter: v.retryAfter });
  }

  if (v.purpose === 'register') {
    // Prompt 05Q §2 Step C: return a verificationToken. The account is NOT created
    // here — /api/auth/register/complete consumes the token + creates the account
    // only after the password is set. No users doc is touched in this step.
    await logSecurityEvent({ type: 'otp_verified', email: v.email, ip, detail: 'register' });
    return NextResponse.json({
      message: 'Email verified. Set your password to complete registration.',
      emailVerified: true,
      verificationToken: v.verificationToken,
      purpose: 'register',
    });
  }

  if (v.purpose === 'password_reset') {
    await logSecurityEvent({ type: 'otp_verified', email: v.email, ip, detail: 'password_reset' });
    return NextResponse.json({
      message: 'Email verified. Set a new password.',
      verificationToken: v.verificationToken,
      purpose: 'password_reset',
    });
  }

  // Other purposes (admin_login, bootstrap) are handled by their own routes.
  return jsonError(400, 'Unexpected verification purpose.');
}
