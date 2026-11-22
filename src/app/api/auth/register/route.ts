/**
 * POST /api/auth/register — DEPRECATED (Prompt 05Q §2).
 *
 * Superseded by the email-first two-step flow:
 *   1. POST /api/auth/register/init   (Step A: name + email + CAPTCHA + ack → OTP)
 *   2. POST /api/auth/otp/verify      (Step C: verify OTP → verificationToken)
 *   3. POST /api/auth/register/complete (Steps D+E: password → create account + session)
 *
 * This old single-step route created an account (with a password) BEFORE email
 * verification — which violates the 05Q requirement that no account exists
 * before OTP verification. It is retained only as a 410 Gone signpost so any
 * old client gets a clear migration message instead of a silent failure.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      error: 'This registration endpoint is deprecated.',
      migration:
        'Use POST /api/auth/register/init (name + email + CAPTCHA + acknowledgement), then /api/auth/otp/verify, then /api/auth/register/complete.',
    },
    { status: 410 },
  );
}
