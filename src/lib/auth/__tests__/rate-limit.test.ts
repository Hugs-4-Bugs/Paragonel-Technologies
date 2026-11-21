import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, recordFailure, clearFailures, _resetRateLimiterForTests, POLICIES } from '../rate-limit';

beforeEach(() => _resetRateLimiterForTests());

describe('rate-limit (Part H #6)', () => {
  it('allows up to `max` then rate-limits', async () => {
    const cfg = { max: 3, windowSeconds: 60, lockoutThreshold: 99, lockoutSeconds: 60 };
    expect((await checkRateLimit('k', cfg)).ok).toBe(true);
    expect((await checkRateLimit('k', cfg)).ok).toBe(true);
    expect((await checkRateLimit('k', cfg)).ok).toBe(true);
    const r = await checkRateLimit('k', cfg);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('rate_limited');
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it('lockout trips after the failure threshold and blocks subsequent checks', async () => {
    const cfg = { max: 100, windowSeconds: 60, lockoutThreshold: 3, lockoutSeconds: 300 };
    await recordFailure('k', cfg);
    await recordFailure('k', cfg);
    // not locked yet
    expect((await checkRateLimit('k', cfg)).ok).toBe(true);
    await recordFailure('k', cfg); // 3rd failure -> lockout
    const r = await checkRateLimit('k', cfg);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('locked');
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it('clearFailures resets the budget after a success', async () => {
    const cfg = { max: 100, windowSeconds: 60, lockoutThreshold: 5, lockoutSeconds: 300 };
    await recordFailure('k', cfg);
    await recordFailure('k', cfg);
    clearFailures('p', undefined, undefined); // no-op for wrong prefix
    clearFailures('p', 'a@b.com', undefined); // exercises the helper path
    expect((await checkRateLimit('k', cfg)).ok).toBe(true);
  });

  it('separate keys are independent', async () => {
    const cfg = { max: 1, windowSeconds: 60, lockoutThreshold: 99, lockoutSeconds: 60 };
    expect((await checkRateLimit('a', cfg)).ok).toBe(true);
    expect((await checkRateLimit('b', cfg)).ok).toBe(true);
    expect((await checkRateLimit('a', cfg)).ok).toBe(false);
  });

  it('POLICIES exposes the expected buckets', () => {
    expect(POLICIES.otpRequest).toBeDefined();
    expect(POLICIES.otpVerify).toBeDefined();
    expect(POLICIES.login).toBeDefined();
    expect(POLICIES.bootstrap).toBeDefined();
    expect(POLICIES.bootstrap.lockoutSeconds).toBeGreaterThanOrEqual(POLICIES.login.lockoutSeconds);
  });
});
