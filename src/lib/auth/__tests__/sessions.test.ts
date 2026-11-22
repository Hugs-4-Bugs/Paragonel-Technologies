import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', async () => {
  const mod = await import('./fake-instance');
  return {
    getAdminDb: () => mod.fakeInstance,
    isAdminConfigured: () => true,
    adminStatus: () => ({ configured: true, emulator: true, error: null }),
  };
});

import { issueSession, verifySession, revokeSession, revokeAllSessionsForAccount } from '../sessions';
import { fakeInstance, resetFake } from './fake-instance';

beforeEach(() => {
  resetFake();
  process.env.JWT_SECRET = 'j'.repeat(48);
  process.env.OTP_SECRET = 'x'.repeat(48);
});

function reqWithCookie(cookie: string) {
  return new Request('http://localhost/api/test', { headers: { cookie } });
}

async function seedAdmin(email: string, role: 'admin' | 'super_admin' | 'editor' | 'viewer', status = 'active') {
  await fakeInstance.collection('admins').doc(email).set({
    email, role, status, tokenVersion: 1000, emailVerified: true,
  });
}

describe('sessions (Part F / Part H #15, #16, #17)', () => {
  it('issues + verifies a valid admin session', async () => {
    await seedAdmin('admin@x.com', 'admin');
    const s = await issueSession({ email: 'admin@x.com', tier: 'admin', role: 'admin' });
    expect(s).not.toBeNull();
    const v = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`));
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.user.email).toBe('admin@x.com');
  });

  it('#15 a SUSPENDED admin cannot authenticate (verifySession rejects)', async () => {
    await seedAdmin('admin@x.com', 'admin');
    const s = await issueSession({ email: 'admin@x.com', tier: 'admin', role: 'admin' });
    // Suspend the account.
    await fakeInstance.collection('admins').doc('admin@x.com').update({ status: 'suspended' });
    const v = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.response.status).toBe(403);
  });

  it('#16 a REVOKED session cannot access protected APIs', async () => {
    await seedAdmin('admin@x.com', 'admin');
    const s = await issueSession({ email: 'admin@x.com', tier: 'admin', role: 'admin' });
    await revokeSession(s!.sid);
    const v = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.response.status).toBe(401);
  });

  it('#16 revokeAllSessionsForAccount (tokenVersion bump) invalidates existing JWTs', async () => {
    await seedAdmin('admin@x.com', 'admin');
    const s = await issueSession({ email: 'admin@x.com', tier: 'admin', role: 'admin' });
    await revokeAllSessionsForAccount('admin@x.com', 'admin');
    const v = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`));
    expect(v.ok).toBe(false);
  });

  it('#17 unauthorized: no cookie -> 401; insufficient permission -> 403', async () => {
    // no cookie
    const noCookie = await verifySession(reqWithCookie(''));
    expect(noCookie.ok).toBe(false);
    if (!noCookie.ok) expect(noCookie.response.status).toBe(401);

    // viewer has cms.read but NOT cms.delete
    await seedAdmin('v@x.com', 'viewer');
    const s = await issueSession({ email: 'v@x.com', tier: 'admin', role: 'viewer' });
    const readOk = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`), 'cms.read', 'admin');
    expect(readOk.ok).toBe(true);
    const del = await verifySession(reqWithCookie(`qf_admin_token=${s!.token}`), 'cms.delete', 'admin');
    expect(del.ok).toBe(false);
    if (!del.ok) expect(del.response.status).toBe(403);
  });

  it('a tampered JWT (wrong signature) is rejected', async () => {
    await seedAdmin('admin@x.com', 'admin');
    const v = await verifySession(reqWithCookie('qf_admin_token=not-a-real-jwt'));
    expect(v.ok).toBe(false);
  });
});
