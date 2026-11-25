/**
 * POST /api/admin/auth/mfa/verify-enroll — complete TOTP MFA enrollment (Phase 3).
 *
 * Requires an active admin session + a pending mfa.totpSecret (from /enroll).
 * Body: { code }. Validates the 6-digit code against the pending secret. On
 * success: mfa.enabled=true, mfa.enrolledAt=now, generates 10 single-use
 * backup codes (bcrypt-hashed, stored), returns the plaintext backup codes
 * ONCE. Bumps tokenVersion so any pre-enrollment sessions are revoked (the
 * admin must log in again, now with TOTP).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth/sessions';
import { verifyTotp, generateBackupCodes, hashBackupCode } from '@/lib/auth/totp';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const v = await verifySession(request, undefined, 'admin');
  if (!v.ok) return v.response;
  const email = v.user.email;

  let body: { code?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const code = (body.code ?? '').replace(/\s+/g, '');
  if (!code) return jsonError(400, 'Enter the 6-digit code from your authenticator app.');

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const ref = db.collection('admins').doc(email);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, 'Admin account not found.');
  const data = snap.data() as {
    mfa?: { totpSecret?: string; enabled?: boolean; backupCodes?: string[] };
    tokenVersion?: number;
  };
  if (!data.mfa?.totpSecret) {
    return jsonError(400, 'Start enrollment first (POST /api/admin/auth/mfa/enroll).');
  }
  if (data.mfa?.enabled) return jsonError(409, 'MFA is already enabled.');

  if (!verifyTotp(code, data.mfa.totpSecret)) {
    await logSecurityEvent({ type: 'mfa_failed', email, ip, detail: 'enroll' });
    return jsonError(400, 'Invalid code. Try again.');
  }

  // Generate + hash backup codes (single-use recovery).
  const plainCodes = generateBackupCodes(10);
  const hashed = await Promise.all(plainCodes.map(hashBackupCode));

  // Bump tokenVersion to revoke pre-enrollment sessions (force re-login with TOTP).
  const currentVersion = data.tokenVersion ?? 0;

  await ref.set(
    {
      mfa: {
        totpSecret: data.mfa.totpSecret,
        enabled: true,
        enrolledAt: Timestamp.fromMillis(Date.now()),
        backupCodes: hashed,
      },
      tokenVersion: currentVersion + 1,
    },
    { merge: true },
  );

  await logSecurityEvent({ type: 'mfa_enrolled', email, ip, detail: 'admin' });

  return NextResponse.json({
    message: 'MFA enabled. Save these backup codes — each is single-use. You will be logged out; please log in again with your authenticator.',
    backupCodes: plainCodes,
    reloginRequired: true,
  });
}
