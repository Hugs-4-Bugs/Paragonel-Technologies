import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';

// Mock firebase-admin so getAdminDb returns the singleton fake.
vi.mock('@/lib/firebase-admin', async () => {
  const mod = await import('./fake-instance');
  return {
    getAdminDb: () => mod.fakeInstance,
    isAdminConfigured: () => true,
    adminStatus: () => ({ configured: true, emulator: true, error: null }),
  };
});

import { issueOtp, verifyOtp } from '../otp';
import { _resetRateLimiterForTests } from '../rate-limit';
import { fakeInstance, resetFake } from './fake-instance';

beforeEach(() => {
  resetFake();
  _resetRateLimiterForTests();
  process.env.OTP_SECRET = 'x'.repeat(48);
});

describe('OTP issue/verify (Part H #1–5, #7)', () => {
  it('#1 valid OTP verifies, consumes the record, returns a verification token', async () => {
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(issued.ok).toBe(true);
    expect(issued.code).toMatch(/^\d{6}$/);
    expect(issued.otpRequestId).toBeTruthy();

    const v = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! });
    expect(v.ok).toBe(true);
    expect(v.email).toBe('a@b.com');
    expect(v.purpose).toBe('register');
    expect(v.verificationToken).toBeTruthy();
  });

  it('#2 invalid OTP is rejected; attempt count increments', async () => {
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    const v = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: '000000' });
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('wrong_code');
    // the correct code still works afterwards (not voided by 1 wrong attempt)
    const v2 = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! });
    expect(v2.ok).toBe(true);
  });

  it('#3 expired OTP is rejected', async () => {
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    // Force the stored expiresAt into the past.
    const col = fakeInstance.collection('otpRequests');
    const first = col.docs.values().next().value as Record<string, unknown>;
    first.expiresAt = Timestamp.fromMillis(Date.now() - 60_000);
    const v = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! });
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('expired');
  });

  it('#4 reused (already-consumed) OTP is rejected — single-use', async () => {
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! }); // consume
    const again = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! });
    expect(again.ok).toBe(false);
    expect(again.reason).toBe('consumed');
  });

  it('#5 resend cooldown blocks a second issue within the window', async () => {
    const first = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(first.ok).toBe(true);
    const second = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('cooldown');
    expect(second.retryAfter).toBeGreaterThan(0);
  });

  it('a new OTP for the same email+purpose supersedes (invalidates) the old one', async () => {
    // Wait past the cooldown by clearing stored issuedAt to the past.
    const first = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(first.ok).toBe(true);
    const col = fakeInstance.collection('otpRequests');
    for (const d of col.docs.values()) (d as Record<string, unknown>).issuedAt = Timestamp.fromMillis(Date.now() - 120_000);

    const second = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(second.ok).toBe(true);
    // The FIRST OTP is now superseded and must not verify.
    const v = await verifyOtp({ otpRequestId: first.otpRequestId!, code: first.code! });
    expect(v.ok).toBe(false);
    expect(['superseded', 'consumed']).toContain(v.reason);
  });

  it('#7 too many wrong attempts voids the OTP (attempt budget)', async () => {
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    for (let i = 0; i < 5; i++) {
      await verifyOtp({ otpRequestId: issued.otpRequestId!, code: '000000' });
    }
    // After 5 wrong attempts the OTP is voided; even the correct code fails.
    const v = await verifyOtp({ otpRequestId: issued.otpRequestId!, code: issued.code! });
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('consumed');
  });

  it('fails closed when OTP_SECRET is misconfigured', async () => {
    delete process.env.OTP_SECRET;
    const issued = await issueOtp({ email: 'a@b.com', purpose: 'register' });
    expect(issued.ok).toBe(false);
    expect(issued.reason).toBe('misconfigured');
  });

  it('a tampered otpRequestId is rejected (invalid_token)', async () => {
    const v = await verifyOtp({ otpRequestId: 'totally.bogus', code: '123456' });
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('invalid_token');
  });
});
