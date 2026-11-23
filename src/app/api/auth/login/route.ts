/**
 * POST /api/auth/login — candidate login (Prompt 05Q §5).
 *
 * Email + password + CAPTCHA + required Terms/Privacy acknowledgement.
 *
 * Flow:
 *   1. Validate email + password + CAPTCHA token + consentAcknowledged.
 *   2. CAPTCHA server-side verification (mandatory, fail-closed).
 *   3. consentAcknowledged MUST be true (server-enforced — a direct API call
 *      cannot bypass it).
 *   4. Rate limit (per email + IP) + uniform-timing bcrypt compare.
 *   5. Requires emailVerified + status 'active' + accountType 'candidate'.
 *   6. Uniform "Invalid email or password" for any failure (no enumeration).
 *   7. On success: issue user session (qf_user_token), record loginConsent
 *      SEPARATELY from the registration consent (never overwrites it).
 *
 * A candidate can NEVER gain admin access via this route (admin sessions use a
 * separate cookie + the admins/ collection + a 2-step flow).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyPassword } from '@/lib/auth/password';
import { issueSession, withSecure } from '@/lib/auth/sessions';
import { POLICIES, checkBoth, recordFailure, clearFailures } from '@/lib/auth/rate-limit';
import { verifyCaptcha } from '@/lib/auth/captcha';
import { buildLoginConsent } from '@/lib/auth/candidate-profile';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string; password?: string; captchaToken?: string; consentAcknowledged?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }
  const email = (body.email ?? '').toLowerCase().trim();
  const password = body.password ?? '';
  const captchaToken = body.captchaToken;
  const consentAcknowledged = body.consentAcknowledged === true;

  if (!EMAIL_RE.test(email) || !password) return jsonError(401, 'Invalid email or password.');

  // CAPTCHA verification (mandatory on login, fail-closed).
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

  // Terms/Privacy acknowledgement (server-enforced, Prompt 05Q §4).
  if (!consentAcknowledged) {
    return jsonError(400, 'Please acknowledge the Terms and Privacy Policy to log in.');
  }

  // Rate limit.
  const rl = await checkBoth('login', POLICIES.login, email, ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', email, ip, detail: 'login' });
    return jsonError(429, 'Too many attempts. Try again later.', { retryAfter: rl.retryAfter });
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('users').doc(email).get();
  const data = snap.exists
    ? (snap.data() as {
        passwordHash?: string;
        emailVerified?: boolean;
        status?: string;
        accountType?: string;
        name?: string;
      })
    : null;

  // Always run a bcrypt compare to keep timing uniform whether or not the account exists.
  const ok = data?.passwordHash ? await verifyPassword(password, data.passwordHash) : false;

  // Reject if: wrong password, no account, not verified, not active, or not a candidate account.
  if (!ok || !data || !data.emailVerified || data.status !== 'active' || data.accountType !== 'candidate') {
    await recordFailure(`login:email:${email}`, POLICIES.login, { email, ip, event: 'login' });
    await recordFailure(`login:ip:${ip ?? 'unknown'}`, POLICIES.login, { email, ip, event: 'login' });
    await logSecurityEvent({ type: 'login_failed', email, ip, detail: 'user' });
    return jsonError(401, 'Invalid email or password.');
  }

  clearFailures('login', email, ip);
  await logSecurityEvent({ type: 'login_success', email, ip, detail: 'user' });

  const session = await issueSession({ email, tier: 'user', role: 'viewer', ip });
  if (!session) return jsonError(503, 'Could not start session.');

  // Record login consent SEPARATELY from the registration consent (Prompt 05Q §4).
  // Never overwrites the original registration consent record.
  const loginConsent = buildLoginConsent(true);
  await db.collection('users').doc(email).set(
    {
      lastLoginAt: Timestamp.fromMillis(Date.now()),
      loginConsent: {
        acknowledged: true,
        termsVersion: loginConsent.termsVersion,
        privacyVersion: loginConsent.privacyVersion,
        timestampUtc: loginConsent.timestampUtc,
        loginAt: loginConsent.loginAt,
      },
    },
    { merge: true },
  );

  const response = NextResponse.json({
    message: 'Logged in.',
    user: { email, name: data.name, tier: 'user' },
  });
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  return response;
}
