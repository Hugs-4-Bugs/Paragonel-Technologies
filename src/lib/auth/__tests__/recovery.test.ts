/**
 * recovery.test.ts — Super Admin credential recovery security tests (Phase 4/6).
 *
 * Verifies the recovery flow's security properties (mocked Admin SDK + OTP —
 * no live SMTP, no real Firestore). Locks:
 *   - Only the configured SUPERADMIN_BOOTSTRAP_EMAIL can be recovered.
 *   - A non-existent account / non-super_admin account is refused (no provisioning).
 *   - The OTP must verify + match the email (no bypass).
 *   - completeRecovery resets passwordHash + bumps tokenVersion + forces MFA re-enrollment.
 *   - Never returns/reads the existing passwordHash or OTP value.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Admin SDK + OTP + password + rate-limit + security-events.
const adminDocMocks: Record<string, { exists: boolean; data?: any }> = {};
const otpStore: Record<string, { email: string; code: string; consumed: boolean }> = {};

vi.mock('@/lib/firebase-admin', () => ({
  // vi.fn so the pre-flight tests can override (return null once) to simulate
  // the Admin SDK being unavailable.
  getAdminDb: vi.fn(() => ({
    collection: (c: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: adminDocMocks[`${c}/${id}`]?.exists ?? false,
          data: () => adminDocMocks[`${c}/${id}`]?.data,
          id,
        }),
        update: async (patch: any) => {
          adminDocMocks[`${c}/${id}`] = adminDocMocks[`${c}/${id}`] ?? { exists: true, data: {} };
          adminDocMocks[`${c}/${id}`].data = { ...adminDocMocks[`${c}/${id}`].data, ...patch };
        },
        set: async (data: any) => { adminDocMocks[`${c}/${id}`] = { exists: true, data }; },
      }),
      where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
    }),
  })),
}));

vi.mock('@/lib/auth/otp', () => ({
  issueOtp: vi.fn(async ({ email, purpose }: { email: string; purpose: string }) => {
    const id = `otp-${email}-${purpose}-${Date.now()}`;
    const code = '123456';
    otpStore[id] = { email, code, consumed: false };
    return { ok: true, otpRequestId: id, code };
  }),
  verifyOtp: vi.fn(async ({ otpRequestId, code }: { otpRequestId: string; code: string }) => {
    const rec = otpStore[otpRequestId];
    if (!rec || rec.consumed || rec.code !== code) return { ok: false, reason: 'wrong_code' };
    rec.consumed = true;
    return { ok: true, email: rec.email };
  }),
  // vi.fn so the pre-flight tests can override (return null once) to simulate
  // OTP_SECRET being missing.
  getOtpSecret: vi.fn(() => 'a'.repeat(40)),
}));

vi.mock('@/lib/auth/email', () => ({
  // vi.fn so the pre-flight tests can override (return false once) to simulate
  // SMTP not being configured.
  isSmtpConfigured: vi.fn(() => true),
  deliverOtp: vi.fn(async () => {}),
  getSmtpConfig: () => null,
  isValidSender: () => true,
}));

vi.mock('@/lib/auth/password', () => ({
  validatePassword: (pw: string) => (pw.length < 8 ? 'too_short' : null),
  passwordPolicyMessage: () => 'Password too short.',
  hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  POLICIES: { bootstrap: { max: 3, windowSeconds: 3600, lockoutThreshold: 5, lockoutSeconds: 3600 } },
  checkRateLimit: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

// Import the mocked functions so the pre-flight tests can override them once.
import { getAdminDb } from '@/lib/firebase-admin';
import { getOtpSecret } from '@/lib/auth/otp';
import { isSmtpConfigured } from '@/lib/auth/email';
import { requestRecoveryOtp, completeRecovery } from '../recovery';

const CONFIGURED_EMAIL = 'contact@prabhat.online';

describe('Super Admin recovery — security properties', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear mocks + set the configured bootstrap email.
    process.env.SUPERADMIN_BOOTSTRAP_EMAIL = CONFIGURED_EMAIL;
    process.env.OTP_SECRET = 'a'.repeat(40);
    for (const k of Object.keys(adminDocMocks)) delete adminDocMocks[k];
    for (const k of Object.keys(otpStore)) delete otpStore[k];
  });

  describe('requestRecoveryOtp', () => {
    it('refuses an email that is NOT the configured bootstrap email (no enumeration path)', async () => {
      const r = await requestRecoveryOtp({ email: 'someone.else@evil.com', ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('not_authorized');
    });

    it('refuses when the configured email has NO admins/ doc (no provisioning)', async () => {
      // No doc exists for contact@prabhat.online.
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('no_account');
    });

    it('refuses when the doc exists but is NOT super_admin (no escalation)', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'editor' } };
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('not_authorized');
    });

    it('issues an OTP for the configured super_admin email (existing account)', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin' } };
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(true);
      expect(r.otpRequestId).toBeTruthy();
      expect(r.maskedEmail).toContain('••••');
      expect(r.code).toBe('123456'); // only returned for the route to email — never to the client
    });

    it('refuses when SUPERADMIN_BOOTSTRAP_EMAIL is not configured (names the var)', async () => {
      delete process.env.SUPERADMIN_BOOTSTRAP_EMAIL;
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('bootstrap_email_not_set');
    });
  });

  describe('requestRecoveryOtp — pre-flight env-var checks (granular reasons)', () => {
    it('refuses with otp_secret_not_set when OTP_SECRET is missing', async () => {
      // SUPERADMIN_BOOTSTRAP_EMAIL is set (beforeEach) + getAdminDb mock returns
      // a db, so the next pre-flight is OTP_SECRET. Override the otp mock to
      // return null for getOtpSecret.
      vi.mocked(getOtpSecret).mockReturnValueOnce(null as any);
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('otp_secret_not_set');
    });

    it('refuses with smtp_not_configured when SMTP is not set (OTP could not be emailed)', async () => {
      vi.mocked(isSmtpConfigured).mockReturnValueOnce(false);
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('smtp_not_configured');
    });

    it('refuses with firebase_not_initialized when the Admin SDK is unavailable', async () => {
      vi.mocked(getAdminDb).mockReturnValueOnce(null as any);
      const r = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('firebase_not_initialized');
    });
  });

  describe('completeRecovery', () => {
    it('refuses a non-configured email even with a valid OTP', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin', tokenVersion: 100 } };
      const issued = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      // Try to complete with a DIFFERENT email (must be refused).
      const r = await completeRecovery({
        email: 'attacker@evil.com',
        otpRequestId: issued.otpRequestId!,
        code: '123456',
        newPassword: 'NewStrongPass1',
        ip: '1.2.3.4',
      });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('not_authorized');
    });

    it('refuses an invalid/expired OTP (no bypass)', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin', tokenVersion: 100 } };
      const issued = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      const r = await completeRecovery({
        email: CONFIGURED_EMAIL,
        otpRequestId: issued.otpRequestId!,
        code: 'WRONG',
        newPassword: 'NewStrongPass1',
        ip: '1.2.3.4',
      });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('invalid_otp');
    });

    it('rejects a weak password', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin', tokenVersion: 100 } };
      const issued = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      const r = await completeRecovery({
        email: CONFIGURED_EMAIL,
        otpRequestId: issued.otpRequestId!,
        code: '123456',
        newPassword: 'short',
        ip: '1.2.3.4',
      });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('weak_password');
    });

    it('resets passwordHash + bumps tokenVersion + forces MFA re-enrollment on success', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin', tokenVersion: 100, passwordHash: 'OLD_HASH', mfa: { enabled: true, totpSecret: 'OLD_SECRET', backupCodes: ['x'] } } };
      const issued = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      const r = await completeRecovery({
        email: CONFIGURED_EMAIL,
        otpRequestId: issued.otpRequestId!,
        code: '123456',
        newPassword: 'NewStrongPass1',
        ip: '1.2.3.4',
      });
      expect(r.ok).toBe(true);
      const doc = adminDocMocks[`admins/${CONFIGURED_EMAIL}`].data;
      expect(doc.passwordHash).toBe('hashed:NewStrongPass1'); // new hash
      expect(doc.tokenVersion).toBe(101); // bumped — revokes prior sessions
      expect(doc.mfa.enabled).toBe(false); // MFA forced re-enrollment
      expect(doc.mfa.totpSecret).toBe(null); // secret cleared
      expect(doc.mfa.backupCodes).toEqual([]); // backup codes cleared
      // The OLD hash is never returned anywhere — verify it's overwritten in the doc.
      expect(doc.passwordHash).not.toBe('OLD_HASH');
    });

    it('the OTP is single-use (a second complete fails)', async () => {
      adminDocMocks[`admins/${CONFIGURED_EMAIL}`] = { exists: true, data: { role: 'super_admin', tokenVersion: 100 } };
      const issued = await requestRecoveryOtp({ email: CONFIGURED_EMAIL, ip: '1.2.3.4' });
      await completeRecovery({ email: CONFIGURED_EMAIL, otpRequestId: issued.otpRequestId!, code: '123456', newPassword: 'NewStrongPass1', ip: '1.2.3.4' });
      const second = await completeRecovery({ email: CONFIGURED_EMAIL, otpRequestId: issued.otpRequestId!, code: '123456', newPassword: 'AnotherPass1', ip: '1.2.3.4' });
      expect(second.ok).toBe(false);
      expect(second.reason).toBe('invalid_otp');
    });
  });
});
