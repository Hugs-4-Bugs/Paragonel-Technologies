/**
 * api-security.test.ts — CSRF / origin, body-size, shared body validation, and
 * the account-mutation rate-limit policy (Task 2).
 *
 * The CSRF + body-size checks are pure functions extracted from the middleware
 * so they can be unit-tested without spinning up the Edge runtime. The
 * middleware imports them; the tests assert the decision matrix the middleware
 * relies on.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  checkSameOrigin,
  checkBodySize,
  isStateChangingMethod,
  MAX_API_BODY_BYTES,
} from '@/lib/api-security';
import { validateRequestBody } from '@/lib/auth/route-helpers';
import { POLICIES } from '@/lib/auth/rate-limit';

const HOST = 'app.paragonel.com';

function headers(obj: Record<string, string>): Headers {
  return new Headers(obj);
}

describe('isStateChangingMethod', () => {
  it('treats POST/PUT/PATCH/DELETE as state-changing', () => {
    expect(isStateChangingMethod('POST')).toBe(true);
    expect(isStateChangingMethod('put')).toBe(true);
    expect(isStateChangingMethod('Patch')).toBe(true);
    expect(isStateChangingMethod('DELETE')).toBe(true);
  });
  it('treats GET/HEAD/OPTIONS as read-only', () => {
    expect(isStateChangingMethod('GET')).toBe(false);
    expect(isStateChangingMethod('HEAD')).toBe(false);
    expect(isStateChangingMethod('OPTIONS')).toBe(false);
  });
});

describe('checkSameOrigin — CSRF protection', () => {
  it('allows read-only GET without any origin signal', () => {
    expect(checkSameOrigin('GET', headers({ host: HOST }))).toEqual({ ok: true });
  });

  it('blocks a state-changing POST with no origin signal (missing-origin)', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST }))).toEqual({ ok: false, reason: 'missing-origin' });
  });

  it('blocks when Host itself is missing', () => {
    expect(checkSameOrigin('POST', headers({}))).toEqual({ ok: false, reason: 'missing-host' });
  });

  it('allows Sec-Fetch-Site: same-origin', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST, 'sec-fetch-site': 'same-origin' }))).toEqual({ ok: true });
  });

  it('allows Sec-Fetch-Site: same-site', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST, 'sec-fetch-site': 'same-site' }))).toEqual({ ok: true });
  });

  it('allows Sec-Fetch-Site: none (user-initiated)', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST, 'sec-fetch-site': 'none' }))).toEqual({ ok: true });
  });

  it('blocks Sec-Fetch-Site: cross-site', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST, 'sec-fetch-site': 'cross-site' }))).toEqual({
      ok: false,
      reason: 'cross-site',
    });
  });

  it('allows a same-host Origin (fallback when no Sec-Fetch-Site)', () => {
    expect(
      checkSameOrigin('POST', headers({ host: HOST, origin: `https://${HOST}` })),
    ).toEqual({ ok: true });
  });

  it('blocks a mismatched Origin (cross-site attacker)', () => {
    expect(
      checkSameOrigin('POST', headers({ host: HOST, origin: 'https://evil.example.com' })),
    ).toEqual({ ok: false, reason: 'origin-mismatch' });
  });

  it('allows a same-host Referer when Origin is absent', () => {
    expect(
      checkSameOrigin('POST', headers({ host: HOST, referer: `https://${HOST}/contact` })),
    ).toEqual({ ok: true });
  });

  it('blocks a mismatched Referer', () => {
    expect(
      checkSameOrigin('POST', headers({ host: HOST, referer: 'https://evil.example.com/x' })),
    ).toEqual({ ok: false, reason: 'referer-mismatch' });
  });

  it('does NOT blanket-bypass: an origin-less, referer-less POST is rejected', () => {
    expect(checkSameOrigin('POST', headers({ host: HOST }))).toEqual({ ok: false, reason: 'missing-origin' });
  });
});

describe('checkBodySize', () => {
  it('allows a small Content-Length', () => {
    expect(checkBodySize(headers({ 'content-length': '1024' }))).toEqual({ ok: true });
  });

  it('allows a missing Content-Length (chunked transfer — route handles it)', () => {
    expect(checkBodySize(headers({}))).toEqual({ ok: true });
  });

  it('rejects a Content-Length over the cap', () => {
    expect(checkBodySize(headers({ 'content-length': String(MAX_API_BODY_BYTES + 1) }))).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it('rejects an invalid Content-Length', () => {
    expect(checkBodySize(headers({ 'content-length': 'not-a-number' }))).toEqual({
      ok: false,
      reason: 'invalid-content-length',
    });
  });

  it('caps at 10 MB but allows a 5 MB resume upload underneath it', () => {
    expect(MAX_API_BODY_BYTES).toBe(10 * 1024 * 1024);
    expect(checkBodySize(headers({ 'content-length': String(5 * 1024 * 1024) }))).toEqual({ ok: true });
  });
});

describe('validateRequestBody — shared JSON + zod validation', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('parses + returns the validated data on success', async () => {
    const req = new Request('https://app.paragonel.com/api/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password1' }),
    });
    const r = await validateRequestBody(req, schema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe('a@b.com');
      expect(r.data.password).toBe('password1');
    }
  });

  it('rejects malformed JSON with 400', async () => {
    const req = new Request('https://app.paragonel.com/api/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const r = await validateRequestBody(req, schema);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(400);
      const body = await r.response.json();
      expect(body.error).toContain('Invalid JSON');
    }
  });

  it('rejects a schema violation with 400 + issues (no internals leak)', async () => {
    const req = new Request('https://app.paragonel.com/api/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });
    const r = await validateRequestBody(req, schema);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(400);
      const body = await r.response.json();
      expect(body.error).toBe('Validation failed');
      expect(Array.isArray(body.issues)).toBe(true);
      expect(body.issues.length).toBeGreaterThan(0);
      // No raw stack / internal dump surfaced.
      expect(JSON.stringify(body)).not.toContain('stack');
    }
  });
});

describe('accountMutation rate-limit policy', () => {
  it('is present with a conservative budget', () => {
    expect(POLICIES.accountMutation).toBeDefined();
    expect(POLICIES.accountMutation.max).toBeLessThanOrEqual(10);
    expect(POLICIES.accountMutation.windowSeconds).toBeGreaterThanOrEqual(60);
    expect(POLICIES.accountMutation.lockoutThreshold).toBeGreaterThan(0);
    expect(POLICIES.accountMutation.lockoutSeconds).toBeGreaterThan(0);
  });

  it('does not disrupt the existing policies', () => {
    // The pre-existing policies must still be present + intact.
    expect(POLICIES.login.max).toBe(10);
    expect(POLICIES.otpRequest.max).toBe(5);
    expect(POLICIES.bootstrap.max).toBe(3);
  });
});
