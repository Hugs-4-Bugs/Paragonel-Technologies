import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', async () => {
  const mod = await import('./fake-instance');
  return {
    getAdminDb: () => mod.fakeInstance,
    isAdminConfigured: () => true,
    adminStatus: () => ({ configured: true, emulator: true, error: null }),
  };
});

import { checkBootstrapAvailable, requestBootstrapOtp, completeBootstrap } from '../bootstrap';
import { _resetRateLimiterForTests } from '../rate-limit';
import { fakeInstance, resetFake } from './fake-instance';

beforeEach(() => {
  resetFake();
  _resetRateLimiterForTests();
  process.env.OTP_SECRET = 'x'.repeat(48);
  process.env.SUPERADMIN_BOOTSTRAP_EMAIL = 'contact@prabhat.online';
});

describe('Super Admin bootstrap (Part D / Part H #9, #10)', () => {
  it('#9 bootstrap is available when no super_admin exists; OTP + password creates it', async () => {
    const avail = await checkBootstrapAvailable();
    expect(avail.available).toBe(true);
    expect(avail.maskedEmail).toContain('••••');

    const r = await requestBootstrapOtp('1.2.3.4');
    expect(r.ok).toBe(true);
    expect(r.otpRequestId).toBeTruthy();
    expect(r.code).toMatch(/^\d{6}$/);

    const done = await completeBootstrap({
      otpRequestId: r.otpRequestId!,
      code: r.code!,
      newPassword: 'BootStrap123!',
    });
    expect(done.ok).toBe(true);
    expect(done.email).toBe('contact@prabhat.online');

    // The admin doc was created with role super_admin + status active.
    const doc = await fakeInstance.collection('admins').doc('contact@prabhat.online').get();
    expect(doc.exists).toBe(true);
    expect((doc.data() as { role: string; status: string }).role).toBe('super_admin');
    expect((doc.data() as { role: string; status: string }).status).toBe('active');
    // password stored as a bcrypt hash, never plaintext
    expect((doc.data() as { passwordHash: string }).passwordHash.startsWith('$2')).toBe(true);
  });

  it('#10 duplicate bootstrap is refused (idempotent + disabled once complete)', async () => {
    // First bootstrap.
    const r = await requestBootstrapOtp('1.2.3.4');
    await completeBootstrap({ otpRequestId: r.otpRequestId!, code: r.code!, newPassword: 'BootStrap123!' });

    // Availability is now false.
    const avail = await checkBootstrapAvailable();
    expect(avail.available).toBe(false);
    expect(avail.reason).toBe('already_complete');

    // A second OTP request is refused.
    const r2 = await requestBootstrapOtp('1.2.3.5');
    expect(r2.ok).toBe(false);
    expect(r2.reason).toBe('already_complete');

    // The bootstrap sentinel is set.
    const sentinel = await fakeInstance.collection('bootstrap').doc('state').get();
    expect(sentinel.exists).toBe(true);
    expect((sentinel.data() as { completed: boolean }).completed).toBe(true);
  });

  it('bootstrap refuses a weak password', async () => {
    const r = await requestBootstrapOtp('1.2.3.4');
    const done = await completeBootstrap({ otpRequestId: r.otpRequestId!, code: r.code!, newPassword: 'short' });
    expect(done.ok).toBe(false);
    expect(done.reason).toBe('weak_password');
  });

  it('bootstrap refuses an invalid OTP', async () => {
    const r = await requestBootstrapOtp('1.2.3.4');
    const done = await completeBootstrap({ otpRequestId: r.otpRequestId!, code: '000000', newPassword: 'BootStrap123!' });
    expect(done.ok).toBe(false);
    expect(done.reason).toBe('invalid_otp');
  });

  it('bootstrap is unavailable when SUPERADMIN_BOOTSTRAP_EMAIL is not configured', async () => {
    delete process.env.SUPERADMIN_BOOTSTRAP_EMAIL;
    const avail = await checkBootstrapAvailable();
    expect(avail.available).toBe(false);
    expect(avail.reason).toBe('not_configured');
  });
});
