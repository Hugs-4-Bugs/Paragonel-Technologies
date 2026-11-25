/**
 * POST /api/admin/auth/mfa/disable — disable TOTP MFA (super_admin only, Phase 3).
 *
 * Recovery path: if a super_admin loses their authenticator device + exhausts
 * backup codes, the founder can clear mfa in the Firebase Console (manual
 * action documented in the report). This endpoint is the in-app recovery:
 * requires a super_admin session + the current password (re-verified). Clears
 * mfa.enabled + the secret + backup codes. Bumps tokenVersion (revokes all
 * sessions). Audit-logged. The super_admin must re-enroll immediately.
 *
 * Never accepts a client-supplied role claim — the role is read from the
 * verified account doc in verifySession.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { verifyPassword } from '@/lib/auth/password';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const v = await verifySession(request, undefined, 'admin');
  if (!v.ok) return v.response;
  // The role is read from the account doc in verifySession (never the JWT claim).
  if (v.user.role !== 'super_admin') {
    return jsonError(403, 'Only Super Admin can disable MFA.');
  }
  const email = v.user.email;

  let body: { password?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const password = body.password ?? '';
  if (!password) return jsonError(400, 'Password required to disable MFA.');

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const ref = db.collection('admins').doc(email);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, 'Account not found.');
  const data = snap.data() as { passwordHash?: string; tokenVersion?: number };
  if (!data.passwordHash || !(await verifyPassword(password, data.passwordHash))) {
    await logSecurityEvent({ type: 'mfa_disable_failed', email, ip, detail: 'bad password' });
    return jsonError(401, 'Invalid password.');
  }

  const currentVersion = data.tokenVersion ?? 0;
  await ref.set(
    {
      mfa: { totpSecret: null, enabled: false, enrolledAt: null, backupCodes: [] },
      tokenVersion: currentVersion + 1,
    },
    { merge: true },
  );

  await logSecurityEvent({ type: 'mfa_disabled', email, ip, detail: 'admin' });
  return NextResponse.json({ message: 'MFA disabled. Re-enroll immediately.' });
}
