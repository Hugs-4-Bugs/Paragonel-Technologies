/**
 * cron-auth.test.ts — regression test for Vercel Cron auth (Batch 4 Task 4).
 *
 * Verifies the cron route can be invoked ONLY with the correct
 * `Bearer <CRON_SECRET>` header, that a missing CRON_SECRET yields an honest
 * 503 (not a silent bypass or a 500), and that wrong/missing headers yield 401.
 */
import { describe, it, expect } from 'vitest';
import { verifyCronSecret } from '@/lib/cron-auth';

describe('verifyCronSecret', () => {
  it('accepts the correct Bearer <CRON_SECRET> header', () => {
    expect(verifyCronSecret('Bearer my-cron-secret', 'my-cron-secret')).toEqual({ ok: true });
  });

  it('rejects a wrong secret with 401', () => {
    const r = verifyCronSecret('Bearer wrong-secret', 'my-cron-secret');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      expect(r.error).toBe('Unauthorized.');
    }
  });

  it('rejects a missing authorization header with 401', () => {
    const r = verifyCronSecret(null, 'my-cron-secret');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('rejects an empty authorization header with 401', () => {
    const r = verifyCronSecret('', 'my-cron-secret');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('rejects a header without the Bearer scheme with 401', () => {
    const r = verifyCronSecret('my-cron-secret', 'my-cron-secret');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('returns an honest 503 (not 500, not a bypass) when CRON_SECRET is unset', () => {
    const r = verifyCronSecret('Bearer my-cron-secret', undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(503);
      expect(r.error).toContain('CRON_SECRET');
    }
  });

  it('returns 503 when CRON_SECRET is the empty string', () => {
    const r = verifyCronSecret('Bearer ', '');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it('does not accept a secret that is a prefix of the header (length mismatch)', () => {
    // CRON_SECRET = 'abc' but header carries 'Bearer abcx' — must NOT match.
    const r = verifyCronSecret('Bearer abcx', 'abc');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('handles a long random secret correctly', () => {
    const long = 'x'.repeat(64);
    expect(verifyCronSecret(`Bearer ${long}`, long)).toEqual({ ok: true });
    expect(verifyCronSecret(`Bearer ${long}`, 'y'.repeat(64)).ok).toBe(false);
  });
});
