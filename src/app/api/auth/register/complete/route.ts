/**
 * POST /api/auth/register/complete — Steps D+E of email-first registration (Prompt 05Q §2).
 *
 * Only after a verified email challenge (verificationToken from /otp/verify,
 * purpose 'register') + a valid password may the server create the candidate
 * account.
 *
 * Flow:
 *   1. Consume the verificationToken (server-side, HMAC-signed, short-lived) → email.
 *   2. Validate password policy + confirm-match.
 *   3. Read + delete the `registrationChallenges/{email}` record (binds name +
 *      consent evidence; must exist + not be expired).
 *   4. TRANSACTIONAL create-if-not-exists of `users/{email}` with
 *      emailVerified:true, status:'active', passwordHash, name, consent evidence,
 *      tokenVersion. Prevents duplicate accounts under race conditions.
 *   5. Issue the authenticated user session (qf_user_token).
 *
 * CRITICAL ACCEPTANCE TEST: before this step succeeds, NO candidate account
 * exists + NO authenticated session can be issued. A client-side green tick or
 * browser variable is NOT proof — only the server-side verificationToken works.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { consumeVerificationToken } from '@/lib/auth/otp';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { issueSession, withSecure } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest, passwordPolicyResponse } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { verificationToken?: string; password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  const { verificationToken, password, confirmPassword } = body;
  if (!verificationToken) return jsonError(400, 'Missing verification token. Restart registration.');

  // 1. Consume the verification token → email (bound to the verified OTP challenge).
  const verified = consumeVerificationToken(verificationToken, 'register');
  if (!verified) {
    return jsonError(400, 'Verification expired or invalid. Please restart registration.');
  }
  const email = verified.email;

  // 2. Validate password + confirm-match.
  if (!password || !confirmPassword) return jsonError(400, 'Password and confirmation are required.');
  if (password !== confirmPassword) return jsonError(400, 'Passwords do not match.');
  const pwErr = validatePassword(password);
  if (pwErr) return passwordPolicyResponse(pwErr);

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  // 3. Read + the registration challenge (binds name + consent). Must exist + not expired.
  const challengeSnap = await db.collection('registrationChallenges').doc(email).get();
  if (!challengeSnap.exists) {
    return jsonError(400, 'Registration session expired. Please restart registration.');
  }
  const challenge = challengeSnap.data() as {
    name: string;
    consentAcknowledged: boolean;
    termsVersion: string;
    privacyVersion: string;
    consentNoticeVersion: string;
    consentTimestampUtc: string;
    expiresAt: Timestamp;
    consumedAt: Timestamp | null;
  };
  if (challenge.consumedAt) {
    // Prevent one verified challenge from creating multiple accounts.
    return jsonError(409, 'This registration has already been completed.');
  }
  if (challenge.expiresAt?.toMillis?.() ? challenge.expiresAt.toMillis() < Date.now() : false) {
    return jsonError(400, 'Registration session expired. Please restart registration.');
  }

  // 4. Transactional create-if-not-exists (race-condition safe).
  const passwordHash = await hashPassword(password);
  let created = false;
  try {
    await db.runTransaction(async (tx) => {
      const userRef = db.collection('users').doc(email);
      const userSnap = await tx.get(userRef);
      if (userSnap.exists) {
        // Race: another request created the account first. Abort cleanly.
        return;
      }
      tx.set(userRef, {
        email,
        name: challenge.name,
        status: 'active',
        emailVerified: true, // verified before creation
        passwordHash,
        tokenVersion: Date.now(),
        createdAt: Timestamp.fromMillis(Date.now()),
        lastLoginAt: Timestamp.fromMillis(Date.now()),
        accountType: 'candidate', // candidate — NEVER admin (Phase 6 separation)
        consent: {
          acknowledged: true,
          termsVersion: challenge.termsVersion,
          privacyVersion: challenge.privacyVersion,
          consentNoticeVersion: challenge.consentNoticeVersion,
          timestampUtc: challenge.consentTimestampUtc,
        },
        loginConsent: null, // set on first acknowledged login
      });
      // Mark the challenge consumed (prevents reuse → prevents multiple accounts).
      tx.update(challengeSnap.ref, { consumedAt: Timestamp.fromMillis(Date.now()) });
      created = true;
    });
  } catch (err) {
    console.error('[register/complete] transaction failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not create account. Please try again.');
  }

  if (!created) {
    // Account already existed (race) — do not issue a session.
    return jsonError(409, 'An account with this email already exists.');
  }

  await logSecurityEvent({ type: 'register', email, ip, detail: 'account_created' });

  // 5. Issue the authenticated session (only after successful creation).
  const session = await issueSession({ email, tier: 'user', role: 'viewer', ip });
  if (!session) {
    // Account created but session failed — user can log in normally.
    return NextResponse.json(
      { message: 'Account created. Please log in.', sessionIssued: false },
      { status: 201 },
    );
  }

  const response = NextResponse.json(
    { message: 'Account created.', user: { email, name: challenge.name, tier: 'user' }, sessionIssued: true },
    { status: 201 },
  );
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  return response;
}
