/**
 * POST /api/auth/change-password — change password while logged in (Part B).
 *
 * Requires an active user session. Verifies the current password, sets the new
 * bcrypt hash, bumps tokenVersion (revokes all other sessions for the account),
 * and re-issues the current session so the caller stays logged in.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyPassword, hashPassword, validatePassword } from '@/lib/auth/password';
import { verifySession, issueSession, revokeSession, withSecure } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest, passwordPolicyResponse } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;

  let body: { currentPassword?: string; newPassword?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return jsonError(400, 'Missing current or new password.');

  const pwErr = validatePassword(newPassword);
  if (pwErr) return passwordPolicyResponse(pwErr);
  if (currentPassword === newPassword) return jsonError(400, 'New password must differ from the current one.');

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('users').doc(v.user.email).get();
  const data = snap.data() as { passwordHash?: string } | undefined;
  if (!data?.passwordHash || !(await verifyPassword(currentPassword, data.passwordHash))) {
    return jsonError(401, 'Current password is incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);
  await db.collection('users').doc(v.user.email).set(
    { passwordHash, tokenVersion: Date.now(), passwordChangedAt: Timestamp.fromMillis(Date.now()) },
    { merge: true }
  );
  // Revoke all sessions for this account, then re-issue the current one.
  // (revokeAllSessionsForAccount bumps tokenVersion again; we already bumped, so
  //  just revoke the session docs and re-issue a fresh session with the new ver.)
  await revokeSession(v.user.sid);
  await logSecurityEvent({ type: 'password_change', email: v.user.email, ip, actor: v.user.email });

  const session = await issueSession({ email: v.user.email, tier: 'user', role: 'viewer', ip });
  if (!session) return NextResponse.json({ message: 'Password changed. Please log in again.' });

  const response = NextResponse.json({ message: 'Password changed.' });
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  return response;
}
