/**
 * POST /api/auth/register/init — Step A of email-first registration (Prompt 05Q §2).
 *
 * Collects: full name, email, CAPTCHA token, required Terms/Privacy acknowledgement.
 * Does NOT collect a password. Does NOT create a candidate account.
 *
 * Flow:
 *   1. Validate name + email + acknowledgement (server-side).
 *   2. Verify CAPTCHA server-side (fail-closed if misconfigured).
 *   3. Anti-enumeration: always return the SAME success shape whether or not the
 *      email is already registered. Only ISSUE + EMAIL an OTP if the email is new.
 *      If the email exists, return a valid-looking otpRequestId (signed token for a
 *      non-existent OTP id) so the response is identical — no code is emailed.
 *   4. Store a short-lived `registrationChallenges/{email}` record binding the
 *      name + consent evidence to this challenge (consumed by /register/complete).
 *   5. Issue OTP (purpose 'register') + email it (only if new).
 *
 * CRITICAL: no `users/{email}` account exists after this step. No session is issued.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { verifyCaptcha } from '@/lib/auth/captcha';
import { buildRegistrationConsent } from '@/lib/auth/candidate-profile';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';
import { signToken } from '@/lib/auth/crypto-utils';
import { getOtpSecret } from '@/lib/auth/otp';
import { randomHex } from '@/lib/auth/crypto-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_TTL_SECONDS = 10 * 60; // 10 minutes

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { name?: string; email?: string; captchaToken?: string; consentAcknowledged?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').toLowerCase().trim();
  const captchaToken = body.captchaToken;
  const consentAcknowledged = body.consentAcknowledged === true;

  // 1. Validate inputs.
  if (name.length < 2 || name.length > 200) return jsonError(400, 'Full name is required (2–200 characters).');
  if (!EMAIL_RE.test(email)) return jsonError(400, 'A valid email is required.');
  if (!consentAcknowledged) {
    return jsonError(400, 'Please acknowledge the Terms and Privacy Policy to continue.');
  }

  // 2. CAPTCHA verification (server-side, fail-closed).
  const captcha = await verifyCaptcha(captchaToken, request);
  if (!captcha.ok) {
    const msg =
      captcha.reason === 'misconfigured'
        ? 'CAPTCHA verification is required but unavailable. Please contact support.'
        : captcha.reason === 'missing_token'
        ? 'Please complete the CAPTCHA.'
        : 'CAPTCHA verification failed. Please try again.';
    return jsonError(400, msg);
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  // 3. Anti-enumeration existence check. Always return the same shape.
  const existing = await db.collection('users').doc(email).get();
  const isNew = !existing.exists;

  // 4. If new, store a registration challenge binding name + consent to the email.
  //    The complete step reads + deletes this. Expired challenges are inert.
  if (isNew) {
    const consent = buildRegistrationConsent(true);
    const expiresAt = Date.now() + CHALLENGE_TTL_SECONDS * 1000;
    await db
      .collection('registrationChallenges')
      .doc(email)
      .set({
        email,
        name,
        consentAcknowledged: true,
        termsVersion: consent.termsVersion,
        privacyVersion: consent.privacyVersion,
        consentNoticeVersion: consent.consentNoticeVersion,
        consentTimestampUtc: consent.timestampUtc,
        issuedAt: Timestamp.fromMillis(Date.now()),
        expiresAt: Timestamp.fromMillis(expiresAt),
        consumedAt: null,
      });
  }

  // 5. Issue + email the OTP ONLY if the email is new. If the email exists, we
  //    still return a valid-looking otpRequestId (signed token for a random
  //    non-existent id) so the response is byte-for-byte identical → no enumeration.
  let otpRequestId: string;
  let emailDelivered = false;
  let emailDeliveryNote: string | undefined;

  if (isNew) {
    const issued = await issueOtp({ email, purpose: 'register', ip });
    if (!issued.ok || !issued.code || !issued.otpRequestId) {
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
    await logSecurityEvent({ type: 'register', email, ip });
  } else {
    // Email exists → return a fake-but-valid-looking signed token (random id).
    // The verify step will return a generic 'not_found'/'expired' for it —
    // indistinguishable from a wrong-code failure to the client.
    const secret = getOtpSecret();
    const fakeId = randomHex(16);
    const exp = Math.floor((Date.now() + CHALLENGE_TTL_SECONDS * 1000) / 1000);
    otpRequestId = secret
      ? signToken(JSON.stringify({ id: fakeId, purpose: 'register', exp }), secret)
      : '';
  }

  return NextResponse.json({
    message: 'If this email is not already registered, a verification code has been sent to it.',
    otpRequestId,
    emailVerified: false,
    emailDelivered,
    emailDeliveryNote,
  });
}
