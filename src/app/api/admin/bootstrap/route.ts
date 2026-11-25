/**
 * /api/admin/bootstrap — one-time Super Admin bootstrap (Part D).
 *
 * GET  → availability ({available, maskedEmail} | {available:false, reason}).
 * POST {action:'request_otp'}                → email an OTP to SUPERADMIN_BOOTSTRAP_EMAIL.
 * POST {action:'complete', otpRequestId, code, newPassword}
 *        → verify OTP + create the super_admin (transactional, idempotent).
 *
 * NO public Super Admin registration. Once a super_admin exists, every action
 * returns {available:false}. No bootstrap/OTP secret reaches the client.
 */
import { NextResponse } from 'next/server';
import {
  checkBootstrapAvailable,
  requestBootstrapOtp,
  completeBootstrap,
  getBootstrapEmail,
} from '@/lib/auth/bootstrap';
import { deliverOtp } from '@/lib/auth/email';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Returns {available, reason?, maskedEmail?} for EVERY state so the bootstrap
  // PAGE can show a SPECIFIC message (not_configured / already_complete /
  // unavailable) instead of a combined generic one. checkBootstrapAvailable()
  // already distinguishes these reasons; the old early-return here collapsed
  // not_configured into a generic jsonError message that hid the actual state
  // from the founder. HTTP status: 200 available, 409 already_complete, 503
  // not_configured/unavailable (so the page's fetch still parses the body).
  const avail = await checkBootstrapAvailable();
  return NextResponse.json(avail, {
    status: avail.available ? 200 : avail.reason === 'already_complete' ? 409 : 503,
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let body: { action?: string; otpRequestId?: string; code?: string; newPassword?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const { action } = body;

  if (action === 'request_otp') {
    const r = await requestBootstrapOtp(ip);
    if (!r.ok) {
      return NextResponse.json({ available: false, reason: r.reason, maskedEmail: r.maskedEmail }, { status: r.reason === 'already_complete' ? 409 : 429 });
    }
    // Email the code (deliverOtp includes the dev-console fallback).
    if (r.code) await deliverOtp(getBootstrapEmail()!, r.code, 'bootstrap');
    return NextResponse.json({
      available: true,
      otpRequestId: r.otpRequestId,
      maskedEmail: r.maskedEmail,
      message: 'A verification code has been sent to the configured Super Admin email.',
    });
  }

  if (action === 'complete') {
    const { otpRequestId, code, newPassword } = body;
    if (!otpRequestId || !code || !newPassword) return jsonError(400, 'Missing code or new password.');
    const r = await completeBootstrap({ otpRequestId, code: String(code), newPassword, ip });
    if (!r.ok) {
      const status = r.reason === 'already_complete' ? 409 : r.reason === 'weak_password' ? 400 : r.reason === 'invalid_otp' ? 400 : 503;
      return jsonError(status, r.message ?? 'Bootstrap failed.', { reason: r.reason });
    }
    return NextResponse.json({ ok: true, email: r.email, message: 'Super Admin created. You can now log in.' });
  }

  return jsonError(400, "Unknown action. Use 'request_otp' or 'complete'.");
}
