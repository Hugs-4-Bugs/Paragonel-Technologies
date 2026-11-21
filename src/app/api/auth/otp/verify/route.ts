/**
 * POST /api/auth/otp/verify — verify an OTP and advance the flow (Part B/E).
 *
 * Single-use: the OTP record is consumed on success (handled in otp.verifyOtp).
 * For 'register' → marks the user's email verified + activates the account.
 * For 'password_reset' → returns a short-lived verificationToken the
 *   /api/auth/reset-password route consumes to set a new password.
 *
 * Never returns the OTP code. Uniform failure messages to avoid leaking state.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
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

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  if (v.purpose === 'register') {
    await db.collection('users').doc(v.email).set(
      { emailVerified: true, status: 'active', verifiedAt: Date.now() },
      { merge: true }
    );
    await logSecurityEvent({ type: 'otp_verified', email: v.email, ip, detail: 'register' });
    return NextResponse.json({ message: 'Email verified. You can now log in.', emailVerified: true });
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
