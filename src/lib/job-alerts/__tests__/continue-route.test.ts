/**
 * continue-route.test.ts — POST /api/job-match/continue (Prompt §7).
 * Locks: 401 no/bad token, 503 DB unconfigured, 200 + processed count, 500 drain
 * throw, + that a continuation is scheduled when moreRemain (APP_BASE_URL set).
 * Mocks firebase-admin, the runtime drain, + next/server.after.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }));
vi.mock('next/server', async (importOriginal) => ({
  // Spread the real exports (NextResponse etc.) + override only `after`.
  ...(await importOriginal()),
  after: afterMock,
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
}));
vi.mock('@/lib/job-alerts/runtime', () => ({
  drainPendingJobMatchEvents: vi.fn(),
}));

import { POST } from '@/app/api/job-match/continue/route';
import { getAdminDb } from '@/lib/firebase-admin';
import { drainPendingJobMatchEvents } from '@/lib/job-alerts/runtime';
import { signContinueToken } from '@/lib/job-alerts/continue-token';
import type { ProcessOutcome } from '@/lib/job-alerts/process';

const mkOutcome = (over: Partial<ProcessOutcome> = {}): ProcessOutcome => ({
  eventId: 'e',
  status: 'processed',
  candidatesEvaluated: 1,
  alertsSent: 0,
  alertsSkipped: 0,
  alertsFailed: 0,
  ...over,
});

function req(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request('https://paragonel.example.com/api/job-match/continue', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/job-match/continue', () => {
  const origOtp = process.env.OTP_SECRET;
  const origBase = process.env.APP_BASE_URL;

  beforeEach(() => {
    process.env.OTP_SECRET = 'a'.repeat(40);
    delete process.env.APP_BASE_URL; // default: no self-chain scheduling in the route tests
    afterMock.mockClear();
    vi.mocked(getAdminDb).mockReturnValue({} as never);
    vi.mocked(drainPendingJobMatchEvents).mockResolvedValue([]);
  });
  afterEach(() => {
    if (origOtp !== undefined) process.env.OTP_SECRET = origOtp;
    else delete process.env.OTP_SECRET;
    if (origBase !== undefined) process.env.APP_BASE_URL = origBase;
    else delete process.env.APP_BASE_URL;
  });

  it('401 when no token', async () => {
    const res = await POST(req());
    expect(res.status).toBe(401);
  });

  it('401 when the token is invalid', async () => {
    const res = await POST(req('not-a-valid-token'));
    expect(res.status).toBe(401);
  });

  it('503 when the database is not configured', async () => {
    vi.mocked(getAdminDb).mockReturnValue(null as never);
    const res = await POST(req(signContinueToken({ iat: Date.now(), hop: 0 })));
    expect(res.status).toBe(503);
  });

  it('200 + processed count when the drain returns no real work (no continuation)', async () => {
    // Batch-16: maxEventsPerRun=1 means any non-empty drain hits the cap, so the
    // didRealWork guard is what prevents a spin. A processed outcome with 0 evals
    // + 0 sends (e.g. all candidates already processed/in-flight) must NOT continue.
    vi.mocked(drainPendingJobMatchEvents).mockResolvedValue([
      mkOutcome({ status: 'processed', candidatesEvaluated: 0, alertsSent: 0 }),
    ]);
    const res = await POST(req(signContinueToken({ iat: Date.now(), hop: 0 })));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processed).toBe(1);
    expect(data.moreRemain).toBe(false);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('schedules a continuation when moreRemain (partial outcome) + APP_BASE_URL set', async () => {
    process.env.APP_BASE_URL = 'https://paragonel.example.com';
    vi.mocked(drainPendingJobMatchEvents).mockResolvedValue([
      mkOutcome({ status: 'pending', partial: true }),
    ]);
    const res = await POST(req(signContinueToken({ iat: Date.now(), hop: 0 })));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.moreRemain).toBe(true);
    expect(afterMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT schedule at/over the hop cap even if moreRemain', async () => {
    process.env.APP_BASE_URL = 'https://paragonel.example.com';
    vi.mocked(drainPendingJobMatchEvents).mockResolvedValue([
      mkOutcome({ status: 'pending', partial: true }),
    ]);
    // hop = MAX-1 is the last hop that may schedule hop+1=MAX; verify it still
    // schedules (MAX-1 + 1 = MAX is < MAX check? hop+1 < MAX → MAX < MAX false → no schedule).
    // Use hop = MAX-2 so hop+1 = MAX-1 < MAX → schedules.
    const t = signContinueToken({ iat: Date.now(), hop: 19 }); // MAX=20 → hop 19: hop+1=20, 20<20 false → no schedule
    const res = await POST(req(t));
    expect(res.status).toBe(200);
    expect(afterMock).not.toHaveBeenCalled(); // at the cap → no further scheduling
  });

  it('500 when the drain throws', async () => {
    vi.mocked(drainPendingJobMatchEvents).mockRejectedValue(new Error('boom'));
    const res = await POST(req(signContinueToken({ iat: Date.now(), hop: 0 })));
    expect(res.status).toBe(500);
  });
});
