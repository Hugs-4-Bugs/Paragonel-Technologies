/**
 * POST /api/auth/login — user login (Part B).
 *
 * Email + password. On success issues a user session (qf_user_token cookie).
 * Requires emailVerified + status 'active'. Uniform "Invalid email or password"
 * for any failure (no enumeration). Rate-limited per email + IP; lockout after
 * threshold. Logs login_success / login_failed security events.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyPassword } from '@/lib/auth/password';
import { issueSession, withSecure } from '@/lib/auth/sessions';
import { POLICIES, checkBoth, recordFailure, clearFailures } from '@/lib/auth/rate-limit';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const email = (body.email ?? '').toLowerCase().trim();
  const password = body.password ?? '';
  if (!EMAIL_RE.test(email) || !password) return jsonError(401, 'Invalid email or password.');

  // Rate limit.
  const rl = await checkBoth('login', POLICIES.login, email, ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', email, ip, detail: 'login' });
    return jsonError(429, 'Too many attempts. Try again later.', { retryAfter: rl.retryAfter });
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('users').doc(email).get();
  const data = snap.exists ? snap.data() as { passwordHash?: string; emailVerified?: boolean; status?: string } : null;

  // Always run a bcrypt compare to keep timing uniform whether or not the account exists.
  const ok = data?.passwordHash ? await verifyPassword(password, data.passwordHash) : false;

  if (!ok || !data || !data.emailVerified || data.status !== 'active') {
    await recordFailure(`login:email:${email}`, POLICIES.login, { email, ip, event: 'login' });
    await recordFailure(`login:ip:${ip ?? 'unknown'}`, POLICIES.login, { email, ip, event: 'login' });
    await logSecurityEvent({ type: 'login_failed', email, ip, detail: 'user' });
    return jsonError(401, 'Invalid email or password.');
  }

  clearFailures('login', email, ip);
  await logSecurityEvent({ type: 'login_success', email, ip, detail: 'user' });

  const session = await issueSession({ email, tier: 'user', role: 'viewer', ip });
  if (!session) return jsonError(503, 'Could not start session.');

  const response = NextResponse.json({ message: 'Logged in.', user: { email, tier: 'user' } });
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  await db.collection('users').doc(email).set({ lastLoginAt: Timestamp.fromMillis(Date.now()) }, { merge: true });
  return response;
}
