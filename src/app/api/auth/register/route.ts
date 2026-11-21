/**
 * POST /api/auth/register — user registration (Part B).
 *
 * Creates a `users/{email}` account (status 'pending_verification') and emails
 * an SMTP OTP (purpose 'register'). The account cannot log in until the email
 * is verified via /api/auth/otp/verify. Passwords are bcrypt-hashed; never
 * plaintext, never returned.
 *
 * Anti-enumeration: if the email is already registered, returns 409 with a
 * clear message (registration existence is not a credential leak; a uniform
 * 200 would make the subsequent verify step impossible to drive).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, passwordPolicyResponse } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const email = (body.email ?? '').toLowerCase().trim();
  const password = body.password ?? '';

  if (!EMAIL_RE.test(email)) return jsonError(400, 'A valid email is required.');
  const pwErr = validatePassword(password);
  if (pwErr) return passwordPolicyResponse(pwErr);

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  // Existence check.
  const existing = await db.collection('users').doc(email).get();
  if (existing.exists) {
    return jsonError(409, 'An account with this email already exists.');
  }

  // Create account (pending verification).
  const passwordHash = await hashPassword(password);
  await db.collection('users').doc(email).set({
    email,
    status: 'pending_verification',
    passwordHash,
    emailVerified: false,
    tokenVersion: Date.now(),
    createdAt: Timestamp.fromMillis(Date.now()),
    lastLoginAt: null,
  });

  // Issue + email the OTP.
  const issued = await issueOtp({ email, purpose: 'register', ip });
  if (!issued.ok || !issued.code || !issued.otpRequestId) {
    return jsonError(429, 'Too many requests. Wait a moment and try again.', { retryAfter: issued.retryAfter ?? 60 });
  }
  const sent = await deliverOtp(email, issued.code, 'register');

  await logSecurityEvent({ type: 'register', email, ip });

  return NextResponse.json({
    message: 'Account created. Enter the verification code sent to your email.',
    otpRequestId: issued.otpRequestId,
    emailVerified: false,
    // Honest about delivery: SMTP may not be configured yet.
    emailDelivered: sent.sent,
    emailDeliveryNote: !sent.sent
      ? (sent.devLogged
        ? 'SMTP not configured — code printed to the server console (dev only).'
        : sent.reason === 'mailpit_dev'
        ? 'Delivered to local Mailpit (dev).'
        : 'SMTP not configured — delivery cannot be verified until the founder supplies credentials.')
      : undefined,
    devPreview: sent.devPreview,
  });
}
