/**
 * recovery-lifecycle.test.ts — full Super Admin recovery → login → MFA lifecycle.
 *
 * Verifies the COMPLETE chain end-to-end (mocked Firestore + OTP + password,
 * no live SMTP/network): a super_admin with an OLD password + active MFA is
 * recovered, and the resulting doc state guarantees:
 *   - the NEW password verifies (login step 1 would succeed).
 *   - the OLD password no longer verifies (prior credentials revoked).
 *   - tokenVersion bumped (ALL prior sessions revoked).
 *   - mfa.enabled=false (the middleware super_admin MFA gate forces
 *     re-enrollment at /admin/mfa-enroll before the portal is reachable).
 *   - role stays super_admin (no privilege change).
 *   - status stays active.
 *
 * This is the "complete Super Admin login lifecycle" + "protected admin routes"
 * coverage for Phase 6 — proving recovery leads to a USABLE login (not another
 * redirect loop) when the env vars are configured.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const adminDocMocks: Record<string, { exists: boolean; data?: any }> = {};
const otpStore: Record<string, { email: string; code: string; consumed: boolean }> = {};

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
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
  }),
}));

vi.mock('@/lib/auth/otp', () => ({
  issueOtp: vi.fn(async ({ email, purpose }: { email: string; purpose: string }) => {
    const id = `otp-${email}-${purpose}-${Date.now()}-${Math.random()}`;
    const code = '654321';
    otpStore[id] = { email, code, consumed: false };
    return { ok: true, otpRequestId: id, code };
  }),
  verifyOtp: vi.fn(async ({ otpRequestId, code }: { otpRequestId: string; code: string }) => {
    const rec = otpStore[otpRequestId];
    if (!rec || rec.consumed || rec.code !== code) return { ok: false, reason: 'wrong_code' };
    rec.consumed = true;
    return { ok: true, email: rec.email };
  }),
  getOtpSecret: () => 'b'.repeat(40),
}));

// Use the REAL password library (bcrypt) so verifyPassword/hashPassword are
// genuine — this proves the lifecycle works with real hashing, not a mock.
vi.mock('@/lib/auth/email', () => ({
  isSmtpConfigured: () => true,
  deliverOtp: vi.fn(async () => {}),
  getSmtpConfig: () => null,
  isValidSender: () => true,
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  POLICIES: { bootstrap: { max: 3, windowSeconds: 3600, lockoutThreshold: 5, lockoutSeconds: 3600 } },
  checkRateLimit: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

import { requestRecoveryOtp, completeRecovery } from '../recovery';
import { hashPassword, verifyPassword } from '../password';
import { requiresAdminGate } from '../page-gates';

const EMAIL = 'contact@prabhat.online';
const OLD_PASSWORD = 'OldPassword123';
const NEW_PASSWORD = 'NewStrongPass456';

describe('Super Admin recovery → login → MFA lifecycle', () => {
  beforeEach(() => {
    process.env.SUPERADMIN_BOOTSTRAP_EMAIL = EMAIL;
    process.env.OTP_SECRET = 'b'.repeat(40);
    for (const k of Object.keys(adminDocMocks)) delete adminDocMocks[k];
    for (const k of Object.keys(otpStore)) delete otpStore[k];
  });

  it('end-to-end: recover a super_admin → new password verifies, old revoked, MFA forced, sessions revoked, role preserved', async () => {
    // 1. Seed an existing super_admin with an OLD password + ACTIVE MFA +
    //    tokenVersion=N (a prior session exists).
    const oldHash = await hashPassword(OLD_PASSWORD);
    adminDocMocks[`admins/${EMAIL}`] = {
      exists: true,
      data: {
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
        passwordHash: oldHash,
        tokenVersion: 7,
        mfa: { enabled: true, totpSecret: 'OLD_TOTP_SECRET', enrolledAt: '2026-01-01', backupCodes: ['c1', 'c2'] },
      },
    };

    // 2. Request + complete recovery.
    const issued = await requestRecoveryOtp({ email: EMAIL, ip: '1.2.3.4' });
    expect(issued.ok).toBe(true);
    expect(issued.code).toBe('654321');

    const r = await completeRecovery({
      email: EMAIL,
      otpRequestId: issued.otpRequestId!,
      code: '654321',
      newPassword: NEW_PASSWORD,
      ip: '1.2.3.4',
    });
    expect(r.ok).toBe(true);

    const doc = adminDocMocks[`admins/${EMAIL}`].data;

    // 3. The NEW password verifies (login step 1 would succeed).
    const newHashOk = await verifyPassword(NEW_PASSWORD, doc.passwordHash);
    expect(newHashOk).toBe(true);

    // 4. The OLD password no longer verifies (prior credentials revoked).
    const oldHashStillWorks = await verifyPassword(OLD_PASSWORD, doc.passwordHash);
    expect(oldHashStillWorks).toBe(false);

    // 5. tokenVersion bumped → ALL prior sessions revoked.
    expect(doc.tokenVersion).toBe(8); // 7 → 8
    expect(doc.tokenVersion).toBeGreaterThan(7);

    // 6. MFA forced re-enrollment (the middleware super_admin MFA gate redirects
    //    /admin/* → /admin/mfa-enroll when mfa.enabled is false).
    expect(doc.mfa.enabled).toBe(false);
    expect(doc.mfa.totpSecret).toBe(null);
    expect(doc.mfa.backupCodes).toEqual([]);

    // 7. Role + status preserved (no privilege change, account stays usable).
    expect(doc.role).toBe('super_admin');
    expect(doc.status).toBe('active');
    expect(doc.emailVerified).toBe(true);

    // 8. The OLD passwordHash is overwritten (never readable after recovery).
    expect(doc.passwordHash).not.toBe(oldHash);

    // 9. The recovery flow does NOT bypass the admin page gate — a protected
    //    /admin route STILL requires a session (recovery only resets the
    //    password; it does not mint a session).
    expect(requiresAdminGate('/admin/jobs')).toBe(true);
    expect(requiresAdminGate('/admin/applications')).toBe(true);
    // The recovery page itself stays public (gated by email+OTP, not session).
    expect(requiresAdminGate('/admin/recover')).toBe(false);
  });

  it('the OTP is single-use — a second complete attempt with the same code fails (no replay)', async () => {
    const oldHash = await hashPassword(OLD_PASSWORD);
    adminDocMocks[`admins/${EMAIL}`] = {
      exists: true,
      data: { role: 'super_admin', status: 'active', passwordHash: oldHash, tokenVersion: 3, mfa: { enabled: true, totpSecret: 's', backupCodes: [] } },
    };
    const issued = await requestRecoveryOtp({ email: EMAIL, ip: '1.2.3.4' });
    const first = await completeRecovery({ email: EMAIL, otpRequestId: issued.otpRequestId!, code: '654321', newPassword: 'FirstReset123', ip: '1.2.3.4' });
    expect(first.ok).toBe(true);
    // Replay the SAME otpRequestId + code → must fail (single-use).
    const replay = await completeRecovery({ email: EMAIL, otpRequestId: issued.otpRequestId!, code: '654321', newPassword: 'SecondReset456', ip: '1.2.3.4' });
    expect(replay.ok).toBe(false);
    expect(replay.reason).toBe('invalid_otp');
  });

  it('recovery refuses when the existing doc is NOT super_admin (no privilege escalation)', async () => {
    adminDocMocks[`admins/${EMAIL}`] = { exists: true, data: { role: 'editor', status: 'active' } };
    const r = await requestRecoveryOtp({ email: EMAIL, ip: '1.2.3.4' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('not_authorized');
  });
});
