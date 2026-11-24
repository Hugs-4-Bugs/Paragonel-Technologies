/**
 * continuation.test.ts — event-driven continuation logic (Prompt §7).
 * Locks: shouldContinueAfter decision + scheduleContinuation (after() + fetch +
 * APP_BASE_URL guard + hop cap). Mocks next/server.after + global fetch.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }));
vi.mock('next/server', () => ({ after: afterMock }));

import { shouldContinueAfter, scheduleContinuation } from '../continuation';
import { verifyContinueToken } from '../continue-token';
import type { ProcessOutcome } from '../process';

const mk = (partial?: boolean, status = 'processed'): ProcessOutcome => ({
  eventId: 'e',
  status,
  candidatesEvaluated: 1,
  alertsSent: 0,
  alertsSkipped: 0,
  alertsFailed: 0,
  partial,
});

describe('shouldContinueAfter (pure)', () => {
  it('true when any outcome is partial (send cap hit)', () => {
    expect(shouldContinueAfter([mk(true, 'pending')], 5)).toBe(true);
  });
  it('true when any outcome is pending', () => {
    expect(shouldContinueAfter([mk(false, 'pending')], 5)).toBe(true);
  });
  it('true when outcomes length >= maxEventsPerRun (more likely pending)', () => {
    const arr = Array.from({ length: 5 }, () => mk(false, 'processed'));
    expect(shouldContinueAfter(arr, 5)).toBe(true);
  });
  it('false when all processed + below cap', () => {
    expect(shouldContinueAfter([mk(false, 'processed')], 5)).toBe(false);
  });
  it('false when empty', () => {
    expect(shouldContinueAfter([], 5)).toBe(false);
  });
});

describe('scheduleContinuation', () => {
  const origBase = process.env.APP_BASE_URL;
  const origOtp = process.env.OTP_SECRET;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.OTP_SECRET = 'a'.repeat(40);
    process.env.APP_BASE_URL = 'https://paragonel.example.com';
    afterMock.mockClear();
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof global.fetch;
  });
  afterEach(() => {
    if (origBase !== undefined) process.env.APP_BASE_URL = origBase;
    else delete process.env.APP_BASE_URL;
    if (origOtp !== undefined) process.env.OTP_SECRET = origOtp;
    else delete process.env.OTP_SECRET;
  });

  it('schedules an after() callback that POSTs to /api/job-match/continue with a Bearer token', async () => {
    scheduleContinuation(0);
    expect(afterMock).toHaveBeenCalledTimes(1);
    const cb = afterMock.mock.calls[0][0];
    expect(typeof cb).toBe('function');
    await cb();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://paragonel.example.com/api/job-match/continue');
    expect(init.method).toBe('POST');
    expect(String(init.headers.authorization).startsWith('Bearer ')).toBe(true);
  });

  it('the token carries the given hop', async () => {
    scheduleContinuation(3);
    const cb = afterMock.mock.calls[0][0];
    await cb();
    const auth = String(fetchMock.mock.calls[0][1].headers.authorization);
    const payload = verifyContinueToken(auth.slice(7));
    expect(payload?.hop).toBe(3);
  });

  it('skips when APP_BASE_URL is unset', () => {
    delete process.env.APP_BASE_URL;
    scheduleContinuation(0);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('skips when APP_BASE_URL is localhost', () => {
    process.env.APP_BASE_URL = 'http://localhost:3000';
    scheduleContinuation(0);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('skips when APP_BASE_URL has no http(s) scheme', () => {
    process.env.APP_BASE_URL = 'paragonel.example.com';
    scheduleContinuation(0);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('skips when hop >= MAX_CONTINUATION_HOPS', () => {
    scheduleContinuation(50);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('swallows a fetch failure (non-fatal — admin manual-drain is the backstop)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    scheduleContinuation(0);
    const cb = afterMock.mock.calls[0][0];
    await expect(cb()).resolves.toBeUndefined();
  });
});
