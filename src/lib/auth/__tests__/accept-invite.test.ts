import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', async () => {
  const mod = await import('./fake-instance');
  return {
    getAdminDb: () => mod.fakeInstance,
    isAdminConfigured: () => true,
    adminStatus: () => ({ configured: true, emulator: true, error: null }),
  };
});

// Import the route handler (public, token-authorizes — no session needed).
import { POST } from '@/app/api/admin/admins/accept-invite/route';
import { signToken } from '../crypto-utils';
import { getOtpSecret } from '../otp';
import { fakeInstance, resetFake } from './fake-instance';

beforeEach(() => {
  resetFake();
  process.env.OTP_SECRET = 'x'.repeat(48);
});

function inviteToken(email: string, role = 'editor', expSecFromNow = 3600) {
  const secret = getOtpSecret()!;
  const exp = Math.floor(Date.now() / 1000) + expSecFromNow;
  return signToken(JSON.stringify({ email, role, purpose: 'admin_invite', exp }), secret);
}

async function callAcceptInvite(token: string, newPassword: string) {
  const req = new Request('http://localhost/api/admin/admins/accept-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const res = await POST(req);
  return { status: res.status, body: await res.json() };
}

async function seedInvited(email: string, role = 'editor') {
  await fakeInstance.collection('admins').doc(email).set({
    email, role, status: 'invited', emailVerified: false, tokenVersion: 1,
  });
}

describe('Admin invitation + acceptance (Part H #7)', () => {
  it('a valid invite token + strong password activates the admin', async () => {
    await seedInvited('inv@x.com', 'editor');
    const { status, body } = await callAcceptInvite(inviteToken('inv@x.com'), 'NewPass123!');
    expect(status).toBe(200);
    expect(body.message).toMatch(/Password set/);
    const doc = await fakeInstance.collection('admins').doc('inv@x.com').get();
    const d = doc.data() as { status: string; emailVerified: boolean; passwordHash: string };
    expect(d.status).toBe('active');
    expect(d.emailVerified).toBe(true);
    expect(d.passwordHash.startsWith('$2')).toBe(true); // bcrypt, never plaintext
  });

  it('rejects an invalid / tampered invite token', async () => {
    await seedInvited('inv@x.com');
    const { status } = await callAcceptInvite('totally.bogus', 'NewPass123!');
    expect(status).toBe(400);
  });

  it('rejects an expired invite token', async () => {
    await seedInvited('inv@x.com');
    const { status } = await callAcceptInvite(inviteToken('inv@x.com', 'editor', -60), 'NewPass123!');
    expect(status).toBe(400);
  });

  it('refuses to re-use an already-accepted invitation (status !== invited)', async () => {
    await seedInvited('inv@x.com');
    // first acceptance
    await callAcceptInvite(inviteToken('inv@x.com'), 'NewPass123!');
    // second use of a fresh token for the same (now active) admin
    const { status } = await callAcceptInvite(inviteToken('inv@x.com'), 'AnotherPass1!');
    expect(status).toBe(409);
  });

  it('rejects a weak password during acceptance', async () => {
    await seedInvited('inv@x.com');
    const { status } = await callAcceptInvite(inviteToken('inv@x.com'), 'short');
    expect(status).toBe(400);
  });

  it('rejects when the invite email has no matching admin doc', async () => {
    const { status } = await callAcceptInvite(inviteToken('nobody@x.com'), 'NewPass123!');
    expect(status).toBe(404);
  });
});
