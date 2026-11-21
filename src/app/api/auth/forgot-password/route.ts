/**
 * POST /api/auth/forgot-password — request a password-reset OTP (Part B).
 *
 * Anti-enumeration: ALWAYS returns the same success message whether or not the
 * email has an account. An OTP is issued + emailed ONLY if the account exists.
 * Rate-limited (issueOtp enforces per-email + per-IP + cooldown).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIFORM_MSG = 'If an account exists for that email, a reset code has been sent.';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const email = (body.email ?? '').toLowerCase().trim();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ message: UNIFORM_MSG });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ message: UNIFORM_MSG });

  const snap = await db.collection('users').doc(email).get();
  if (snap.exists) {
    const issued = await issueOtp({ email, purpose: 'password_reset', ip });
    if (issued.ok && issued.code && issued.otpRequestId) {
      await deliverOtp(email, issued.code, 'password_reset');
      return NextResponse.json({ message: UNIFORM_MSG, otpRequestId: issued.otpRequestId, purpose: 'password_reset' });
    }
  }
  // Account doesn't exist OR rate-limited — uniform response, no requestId.
  return NextResponse.json({ message: UNIFORM_MSG });
}
