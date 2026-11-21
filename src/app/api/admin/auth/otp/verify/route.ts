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
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError, isSecureRequest } from '@/lib/auth/route-helpers';
import type { Role } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { step1Token?: string; otpRequestId?: string; code?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { step1Token, otpRequestId, code } = body;
  if (!step1Token || !otpRequestId || !code) return jsonError(400, 'Missing verification code.');

  const step1 = verifyAdminStep1Token(step1Token);
  if (!step1) return jsonError(401, 'Password verification expired. Please log in again.');

  const v = await verifyOtp({ otpRequestId, code: String(code), ip });
  if (!v.ok || v.purpose !== 'admin_login' || v.email !== step1.email) {
    await logSecurityEvent({ type: 'otp_failed', email: step1.email, ip, detail: 'admin_login' });
    return jsonError(400, 'Invalid or expired verification code.', { reason: v.reason });
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snap = await db.collection('admins').doc(step1.email).get();
  const data = snap.data() as { role?: Role; status?: string } | undefined;
  if (!snap.exists || data?.status !== 'active') {
    return jsonError(403, 'Account is not active.');
  }
  const role: Role = data.role ?? 'viewer';

  const session = await issueSession({ email: step1.email, tier: 'admin', role, ip });
  if (!session) return jsonError(503, 'Could not start session.');

  await logSecurityEvent({ type: 'login_success', email: step1.email, ip, detail: 'admin step2' });

  const response = NextResponse.json({
    message: 'Logged in.',
    user: { email: step1.email, tier: 'admin', role },
  });
  response.cookies.set(session.cookieName, session.token, withSecure(session.cookie, isSecureRequest(request)));
  return response;
}
