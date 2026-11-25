/**
 * POST /api/admin/auth/otp/verify — admin login STEP 2 (Part B/D).
 *
 * Requires the step-1 token (password already verified) + the OTP code. On
 * success issues a FULL admin session (qf_admin_token cookie) with the role
 * read from the `admins/{email}` doc. This is the ONLY endpoint that grants
 * admin access — password alone never does.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyOtp } from '@/lib/auth/otp';
import { verifyAdminStep1Token } from '@/lib/auth/admin-step1';
import { issueSession, withSecure } from '@/lib/auth/sessions';
import { verifyTotp, verifyBackupCode } from '@/lib/auth/totp';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest } from '@/lib/auth/route-helpers';
import type { Role } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { step1Token?: string; otpRequestId?: string; code?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { step1Token, code } = body;
  // otpRequestId is required for the email-OTP path but NOT the TOTP/MFA path.
  if (!step1Token || !code) return jsonError(400, 'Missing verification code.');

  const step1 = verifyAdminStep1Token(step1Token);
  if (!step1) return jsonError(401, 'Password verification expired. Please log in again.');

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const ref = db.collection('admins').doc(step1.email);
  const snap = await ref.get();
  const data = snap.data() as {
    role?: Role; status?: string;
    mfa?: { enabled?: boolean; totpSecret?: string; backupCodes?: string[] };
  } | undefined;
  if (!snap.exists || data?.status !== 'active') {
    return jsonError(403, 'Account is not active.');
  }
  const role: Role = data.role ?? 'viewer';
  const mfaEnabled = !!data.mfa?.enabled;

  let verified = false;
  if (mfaEnabled) {
    // TOTP or backup code (NOT email OTP). The authenticator is the second factor.
    const codeStr = String(code).replace(/\s+/g, '');
    const backupHashes = Array.isArray(data.mfa?.backupCodes) ? data.mfa.backupCodes : [];
    if (backupHashes.length) {
      const idx = await verifyBackupCode(codeStr, backupHashes);
      if (idx >= 0) {
        // Single-use: remove the consumed backup code.
        const newHashes = backupHashes.filter((_, i) => i !== idx);
        await ref.set({ mfa: { ...data.mfa, backupCodes: newHashes } }, { merge: true });
        verified = true;
      }
    }
    if (!verified) {
      verified = verifyTotp(codeStr, data.mfa?.totpSecret || '');
    }
    if (!verified) {
      await logSecurityEvent({ type: 'mfa_failed', email: step1.email, ip, detail: 'admin_login' });
      return jsonError(400, 'Invalid or expired code.', { reason: 'invalid_totp' });
    }
  } else {
    // Email-OTP second factor (first login before TOTP enrollment, or non-MFA admins).
    if (!body.otpRequestId) return jsonError(400, 'Missing verification code.');
    const v = await verifyOtp({ otpRequestId: body.otpRequestId, code: String(code), ip });
    if (!v.ok || v.purpose !== 'admin_login' || v.email !== step1.email) {
      await logSecurityEvent({ type: 'otp_failed', email: step1.email, ip, detail: 'admin_login' });
      return jsonError(400, 'Invalid or expired verification code.', { reason: v.reason });
    }
    verified = true;
  }

  const session = await issueSession({ email: step1.email, tier: 'admin', role, ip, mfaEnrolled: mfaEnabled });
  if (!session) return jsonError(503, 'Could not start session.');

  await logSecurityEvent({ type: 'login_success', email: step1.email, ip, detail: mfaEnabled ? 'admin step2 (mfa)' : 'admin step2' });

  const response = NextResponse.json({
    message: 'Logged in.',
    user: { email: step1.email, tier: 'admin', role },
    mfaEnrolled: mfaEnabled,
  });
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  return response;
}
