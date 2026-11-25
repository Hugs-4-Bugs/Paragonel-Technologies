/**
 * newsletter-lifecycle.test.ts — double-opt-in subscribe + confirm lifecycle
 * (Batch 2 Task 5). Exercises the /api/newsletter POST + /api/newsletter/confirm
 * GET handlers against the in-memory fake-firestore (no emulator) with the SMTP
 * send mocked. Covers: new subscribe → pending, duplicate-pending → 202 (no
 * re-send), already-active → 409, confirm activates, confirm idempotent on
 * active, invalid token rejected.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase-admin', async () => {
  const mod = await import('@/lib/auth/__tests__/fake-instance');
  return {
    getAdminDb: () => mod.fakeInstance,
    isAdminConfigured: () => true,
    adminStatus: () => ({ configured: true, emulator: true, error: null }),
  };
});

vi.mock('@/lib/email', () => ({
  sendNewsletterConfirmation: vi.fn(async () => ({ status: 'sent', detail: 'via:smtp', messageId: 'm1' })),
}));

import { POST } from '@/app/api/newsletter/route';
import { GET as confirmGET } from '@/app/api/newsletter/confirm/route';
import { fakeInstance, resetFake } from '@/lib/auth/__tests__/fake-instance';
import { signNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';

const SECRET = 'test-secret-min-32-chars-long-aaaaaaa';

beforeEach(() => {
  resetFake();
  process.env.OTP_SECRET = SECRET;
  process.env.JWT_SECRET = SECRET;
  process.env.APP_BASE_URL = 'http://localhost:3000';
});

let ipCounter = 0;
function uniqIp(): string {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

function subscribeReq(email: string) {
  return new Request('http://localhost:3000/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      'x-forwarded-for': uniqIp(),
    },
    body: JSON.stringify({ email }),
  });
}

function confirmReq(token: string) {
  return new Request(`http://localhost:3000/api/newsletter/confirm?token=${encodeURIComponent(token)}`, {
    headers: { host: 'localhost:3000', 'x-forwarded-for': uniqIp() },
  });
}

async function subscriberStatus(email: string): Promise<string | undefined> {
  const snap = await fakeInstance.collection('newsletterSubscribers').where('email', '==', email).limit(10).get();
  const active = snap.docs.find((d) => (d.data() as { deletedAt?: unknown }).deletedAt == null);
  return active ? (active.data() as { status?: string }).status : undefined;
}

describe('newsletter subscribe — double opt-in', () => {
  it('creates a pending subscriber + sends a confirmation email (201)', async () => {
    const res = await POST(subscribeReq('A@B.com'));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('pending');
    expect(body.success).toBe(true);
    expect(await subscriberStatus('a@b.com')).toBe('pending');
  });

  it('returns 202 (no re-send) when the email is already pending', async () => {
    await POST(subscribeReq('pending@x.com'));
    const res2 = await POST(subscribeReq('pending@x.com'));
    expect(res2.status).toBe(202);
    // Still exactly one non-deleted doc, still pending.
    expect(await subscriberStatus('pending@x.com')).toBe('pending');
    const snap = await fakeInstance.collection('newsletterSubscribers').where('email', '==', 'pending@x.com').get();
    expect(snap.docs.filter((d) => (d.data() as { deletedAt?: unknown }).deletedAt == null)).toHaveLength(1);
  });

  it('returns 409 when the email is already active', async () => {
    await POST(subscribeReq('active@x.com'));
    // Confirm to activate.
    await confirmGET(confirmReq(signNewsletterConfirmToken('active@x.com')));
    expect(await subscriberStatus('active@x.com')).toBe('active');
    const res2 = await POST(subscribeReq('active@x.com'));
    expect(res2.status).toBe(409);
  });
});

describe('newsletter confirm — HMAC activation', () => {
  it('activates a pending subscriber (status → active)', async () => {
    await POST(subscribeReq('confirm@x.com'));
    expect(await subscriberStatus('confirm@x.com')).toBe('pending');
    const res = await confirmGET(confirmReq(signNewsletterConfirmToken('confirm@x.com')));
    expect(res.status).toBe(200);
    expect(await subscriberStatus('confirm@x.com')).toBe('active');
  });

  it('is idempotent: confirming an already-active subscription is a 200 no-op', async () => {
    await POST(subscribeReq('idem@x.com'));
    await confirmGET(confirmReq(signNewsletterConfirmToken('idem@x.com')));
    const res2 = await confirmGET(confirmReq(signNewsletterConfirmToken('idem@x.com')));
    expect(res2.status).toBe(200);
    expect(await subscriberStatus('idem@x.com')).toBe('active');
  });

  it('rejects an invalid/tampered token with 400', async () => {
    const res = await confirmGET(confirmReq('not-a-valid-token'));
    expect(res.status).toBe(400);
  });

  it('a confirm token for one email does not activate another (signature binding)', async () => {
    await POST(subscribeReq('victim@x.com'));
    // Token bound to a different email.
    const res = await confirmGET(confirmReq(signNewsletterConfirmToken('attacker@x.com')));
    // No pending doc for attacker@x.com → "not found" 400; victim stays pending.
    expect(res.status).toBe(400);
    expect(await subscriberStatus('victim@x.com')).toBe('pending');
  });
});
