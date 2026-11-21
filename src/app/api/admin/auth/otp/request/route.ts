/**
 * POST /api/admin/auth/otp/request — resend the admin login OTP (Part B).
 *
 * Requires a valid step-1 token (password already verified). Resend cooldown
 * is enforced inside issueOtp (60 s per email+purpose). Rate-limited.
 */
import { NextResponse } from 'next/server';
import { issueOtp } from '@/lib/auth/otp';
import { deliverOtp } from '@/lib/auth/email';
import { verifyAdminStep1Token } from '@/lib/auth/admin-step1';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { step1Token?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { step1Token } = body;
  if (!step1Token) return jsonError(401, 'Password verification required.');

  const step1 = verifyAdminStep1Token(step1Token);
  if (!step1) return jsonError(401, 'Password verification expired. Please log in again.');

  const issued = await issueOtp({ email: step1.email, purpose: 'admin_login', ip });
  if (!issued.ok || !issued.code || !issued.otpRequestId) {
    return jsonError(429, 'Too many code requests. Wait a moment and try again.', { retryAfter: issued.retryAfter ?? 60, reason: issued.reason });
  }
  const sent = await deliverOtp(step1.email, issued.code, 'admin_login');

  return NextResponse.json({
    otpRequestId: issued.otpRequestId,
    message: 'A new verification code has been sent.',
    emailDelivered: sent.sent,
    emailDeliveryNote: !sent.sent
      ? (sent.devLogged
        ? 'SMTP not configured — code printed to the server console (dev only).'
        : 'SMTP not configured — delivery cannot be verified until credentials are supplied.')
      : undefined,
  });
}
