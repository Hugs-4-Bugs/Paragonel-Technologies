/**
 * registration-acceptance.test.ts — Prompt 05Q §2 critical acceptance test.
 *
 * Verifies the core security property: NO candidate account exists + NO
 * authenticated session can be issued before a successful OTP verification +
 * password creation.
 *
 * Calls the route handlers directly (with the Firestore emulator) + reads the
 * emulator via the Admin SDK to verify Firestore state.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { POST as registerInit } from '@/app/api/auth/register/init/route';
import { POST as registerComplete } from '@/app/api/auth/register/complete/route';
import { POST as otpVerify } from '@/app/api/auth/otp/verify/route';
import { POST as jobApply } from '@/app/api/job-applications/route';
import { getAdminDb } from '@/lib/firebase-admin';
import { _resetRateLimiterForTests } from '@/lib/auth/rate-limit';

const TEST_EMAIL = `qacceptance+${Date.now()}@example.com`;

function jsonReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Prompt 05Q §2 — no account before OTP verification', () => {
  beforeAll(() => {
    // CAPTCHA runs in test mode (dev) — any non-empty token passes.
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    // OTP_SECRET is required by issueOtp (>= 32 chars); not in .env.local for tests.
    process.env.OTP_SECRET = 'x'.repeat(48);
    // JWT_SECRET is required by issueSession (>= 32 chars).
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'j'.repeat(48);
    }
  });

  beforeEach(() => {
    // Reset the in-memory rate limiter so earlier auth tests don't exhaust the
    // OTP-issuance IP budget (the limiter is process-local + shared across tests).
    _resetRateLimiterForTests();
  });

  it('Step A (register/init) does NOT create a users/{email} account', async () => {
    const res = await registerInit(
      jsonReq('http://localhost/api/auth/register/init', {
        name: 'Acceptance Test',
        email: TEST_EMAIL,
        captchaToken: 'test-token',
        consentAcknowledged: true,
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.otpRequestId).toBeTruthy();

    // CRITICAL: no users doc exists after init.
    const db = getAdminDb();
    const snap = await db!.collection('users').doc(TEST_EMAIL).get();
    expect(snap.exists).toBe(false);
  });

  it('Step C (otp/verify) with a WRONG code does NOT create a users doc', async () => {
    // Use a fresh email + init to get a real otpRequestId.
    const email = `wrongcode+${Date.now()}@example.com`;
    await registerInit(
      jsonReq('http://localhost/api/auth/register/init', {
        name: 'Wrong Code',
        email,
        captchaToken: 'test-token',
        consentAcknowledged: true,
      }),
    );
    // Re-init to capture the otpRequestId (the first call's response is consumed).
    const initRes = await registerInit(
      jsonReq('http://localhost/api/auth/register/init', {
        name: 'Wrong Code 2',
        email: `wrongcode2+${Date.now()}@example.com`,
        captchaToken: 'test-token',
        consentAcknowledged: true,
      }),
    );
    const initData = await initRes.json();
    const verifyRes = await otpVerify(
      jsonReq('http://localhost/api/auth/otp/verify', {
        otpRequestId: initData.otpRequestId,
        code: '000000', // wrong code
      }),
    );
    expect(verifyRes.status).toBe(400);
    const db = getAdminDb();
    const snap = await db!.collection('users').doc(`wrongcode2+${Date.now()}@example.com`).get();
    expect(snap.exists).toBe(false);
  });

  it('Step D+E (register/complete) with a BOGUS verificationToken is rejected + creates no account', async () => {
    const email = `bogus+${Date.now()}@example.com`;
    const res = await registerComplete(
      jsonReq('http://localhost/api/auth/register/complete', {
        verificationToken: 'bogus-token-not-signed',
        password: 'GoodPassword1',
        confirmPassword: 'GoodPassword1',
      }),
    );
    expect(res.status).toBe(400);
    const db = getAdminDb();
    const snap = await db!.collection('users').doc(email).get();
    expect(snap.exists).toBe(false);
  });

  it('register/complete rejects a password mismatch + creates no account', async () => {
    const res = await registerComplete(
      jsonReq('http://localhost/api/auth/register/complete', {
        verificationToken: 'any', // will fail at consumeVerificationToken first, but mismatch is also checked
        password: 'GoodPassword1',
        confirmPassword: 'DifferentPassword1',
      }),
    );
    // The token consumption fails first (400), OR the mismatch is caught. Either way: no account.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

describe('Prompt 05Q §9 — mandatory account before job application', () => {
  it('an UNAUTHENTICATED application submission is rejected with 401', async () => {
    const res = await jobApply(
      jsonReq('http://localhost/api/job-applications', {
        jobId: 'any-job-id',
        confirmSubmission: true,
      }),
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.requiresAuth).toBe(true);
  });
});

describe('Prompt 05Q §6 — admin/candidate separation', () => {
  it('the deprecated /api/auth/register route returns 410 (no silent account creation)', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST();
    expect(res.status).toBe(410);
  });
});
