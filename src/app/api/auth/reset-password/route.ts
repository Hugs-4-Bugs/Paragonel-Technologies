/**
 * POST /api/auth/reset-password — set a new password after email verification (Part B).
 *
 * Consumes the `verificationToken` returned by /api/auth/otp/verify (purpose
 * 'password_reset'). Sets the new bcrypt hash + bumps tokenVersion (revokes all
 * existing sessions for the account). The verification token is single-use-ish
 * (10 min TTL); a fresh reset requires a fresh OTP.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { consumeVerificationToken } from '@/lib/auth/otp';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { revokeAllSessionsForAccount } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, passwordPolicyResponse } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { verificationToken?: string; newPassword?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { verificationToken, newPassword } = body;
  if (!verificationToken || !newPassword) return jsonError(400, 'Missing verification token or new password.');

  const v = consumeVerificationToken(verificationToken, 'password_reset');
  if (!v) return jsonError(400, 'Invalid or expired verification. Please request a new reset code.');

  const pwErr = validatePassword(newPassword);
  if (pwErr) return passwordPolicyResponse(pwErr);

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const passwordHash = await hashPassword(newPassword);
  await db.collection('users').doc(v.email).set(
    { passwordHash, tokenVersion: Date.now(), passwordChangedAt: Timestamp.fromMillis(Date.now()) },
    { merge: true }
  );
  await revokeAllSessionsForAccount(v.email, 'user');
  await logSecurityEvent({ type: 'password_reset', email: v.email, ip });

  return NextResponse.json({ message: 'Password reset. You can now log in.' });
}
