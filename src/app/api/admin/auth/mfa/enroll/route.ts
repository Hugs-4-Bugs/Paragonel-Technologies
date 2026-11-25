/**
 * POST /api/admin/auth/mfa/enroll — begin TOTP MFA enrollment (Phase 3).
 *
 * Requires an active admin session (verifySession tier:'admin'). Generates a
 * TOTP secret, stores it in the admin doc as mfa.totpSecret + mfa.enabled:false
 * (NOT yet active). Returns the secret + otpauth URI + QR data URL ONCE so the
 * admin can scan it. The admin then verifies at /api/admin/auth/mfa/verify-enroll.
 *
 * If MFA is already enabled, returns 409 (use /mfa/disable first). The secret
 * is never returned again after this call (re-enrollment requires disable first).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { generateTotpSecret, totpUri, qrCodeDataUrl } from '@/lib/auth/totp';
import { jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const v = await verifySession(request, undefined, 'admin');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const ref = db.collection('admins').doc(email);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, 'Admin account not found.');
  const data = snap.data() as { mfa?: { enabled?: boolean } };
  if (data.mfa?.enabled) {
    return jsonError(409, 'MFA is already enabled. Disable it first to re-enroll.');
  }

  const secret = generateTotpSecret();
  const uri = totpUri(email, secret);
  const qrDataUrl = await qrCodeDataUrl(uri);

  // Store the pending secret (enabled:false). The admin verifies next.
  await ref.set(
    { mfa: { totpSecret: secret, enabled: false, enrolledAt: null, backupCodes: [] } },
    { merge: true },
  );

  return NextResponse.json({ secret, otpauthUri: uri, qrDataUrl });
}
