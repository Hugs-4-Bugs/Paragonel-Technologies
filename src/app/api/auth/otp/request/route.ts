/**
 * POST /api/auth/otp/request — candidate OTP resend (Prompt 05Q §2 Step B, §3).
 *
 * Resends a registration OTP to an email that has an active (unconsumed,
 * unexpired) registration challenge. Rate-limited + cooldown-enforced via
 * issueOtp (60s resend cooldown, per-email+per-IP limits, attempt budget).
 *
 * Anti-enumeration: returns the SAME success shape whether or not the email has
 * an active challenge. Only actually issues + emails an OTP if a challenge exists.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';
import { getOtpSecret } from '@/lib/auth/otp';
import { signToken, randomHex } from '@/lib/auth/crypto-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_TTL_SECONDS = 10 * 60;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }
  const email = (body.email ?? '').toLowerCase().trim();
  if (!EMAIL_RE.test(email)) return jsonError(400, 'A valid email is required.');

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  // Anti-enumeration: check for an active registration challenge. Only resend if
  // one exists + is not consumed/expired. Always return the same shape.
  let hasActiveChallenge = false;
  try {
    const snap = await db.collection('registrationChallenges').doc(email).get();
    if (snap.exists) {
      const ch = snap.data() as { consumedAt: Timestamp | null; expiresAt: Timestamp };
      if (!ch.consumedAt && ch.expiresAt?.toMillis?.() ? ch.expiresAt.toMillis() > Date.now() : false) {
        hasActiveChallenge = true;
      }
    }
  } catch {
    // Fall through — treat as no challenge.
  }

  let otpRequestId: string;
  let emailDelivered = false;
  let emailDeliveryNote: string | undefined;
  let retryAfter: number | undefined;

  if (hasActiveChallenge) {
    const issued = await issueOtp({ email, purpose: 'register', ip });
    if (!issued.ok || !issued.code || !issued.otpRequestId) {
      // Rate-limited or cooldown — return a uniform rate-limit response.
      return jsonError(429, 'Too many requests. Wait a moment and try again.', {
        retryAfter: issued.retryAfter ?? 60,
      });
    }
    otpRequestId = issued.otpRequestId;
    const sent = await deliverOtp(email, issued.code, 'register');
    emailDelivered = sent.sent;
    emailDeliveryNote = !sent.sent
      ? sent.devLogged
        ? 'SMTP not configured — code printed to the server console (dev only).'
        : sent.reason === 'mailpit_dev'
        ? 'Delivered to local Mailpit (dev).'
        : 'SMTP not configured — delivery cannot be verified until credentials are supplied.'
      : undefined;
  } else {
    // No active challenge — return a valid-looking fake token (no code emailed).
    const secret = getOtpSecret();
    const fakeId = randomHex(16);
    const exp = Math.floor((Date.now() + CHALLENGE_TTL_SECONDS * 1000) / 1000);
    otpRequestId = secret ? signToken(JSON.stringify({ id: fakeId, purpose: 'register', exp }), secret) : '';
  }

  return NextResponse.json({
    message: 'If an active registration exists for this email, a new verification code has been sent.',
    otpRequestId,
    emailDelivered,
    emailDeliveryNote,
    retryAfter,
  });
}
