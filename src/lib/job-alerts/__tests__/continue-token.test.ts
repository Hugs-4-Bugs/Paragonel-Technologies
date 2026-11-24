/**
 * continue-token.test.ts — HMAC continuation token (Prompt §7).
 * Locks: valid sign+verify, tamper rejection, expiry, hop cap, no-secret fail-closed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  signContinueToken,
  verifyContinueToken,
  MAX_CONTINUATION_HOPS,
} from '../continue-token';

describe('continue-token', () => {
  const origOtp = process.env.OTP_SECRET;
  const origJwt = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.OTP_SECRET = 'a'.repeat(40);
    delete process.env.JWT_SECRET;
  });
  afterEach(() => {
    if (origOtp !== undefined) process.env.OTP_SECRET = origOtp;
    else delete process.env.OTP_SECRET;
    if (origJwt !== undefined) process.env.JWT_SECRET = origJwt;
    else delete process.env.JWT_SECRET;
  });

  it('signs + verifies a valid token (round-trip)', () => {
    const t = signContinueToken({ iat: Date.now(), hop: 0 });
    expect(t).toBeTruthy();
    const p = verifyContinueToken(t);
    expect(p).not.toBeNull();
    expect(p!.hop).toBe(0);
    expect(p!.iat).toBeGreaterThan(0);
  });

  it('rejects a tampered signature', () => {
    const t = signContinueToken({ iat: Date.now(), hop: 0 });
    const tampered = t.slice(0, -2) + 'xx';
    expect(verifyContinueToken(tampered)).toBeNull();
  });

  it('rejects a tampered body', () => {
    const t = signContinueToken({ iat: Date.now(), hop: 0 });
    // Flip a char in the body half (before the '.').
    const idx = t.indexOf('.');
    const tampered = t.slice(0, idx - 1) + (t[idx - 1] === 'a' ? 'b' : 'a') + t.slice(idx);
    expect(verifyContinueToken(tampered)).toBeNull();
  });

  it('rejects an expired token (>10 min)', () => {
    const t = signContinueToken({ iat: Date.now() - 11 * 60 * 1000, hop: 0 });
    expect(verifyContinueToken(t)).toBeNull();
  });

  it('accepts a token just inside the TTL', () => {
    const t = signContinueToken({ iat: Date.now() - 9 * 60 * 1000, hop: 0 });
    expect(verifyContinueToken(t)).not.toBeNull();
  });

  it('rejects a token at/over MAX_CONTINUATION_HOPS (chain-depth bound)', () => {
    const t = signContinueToken({ iat: Date.now(), hop: MAX_CONTINUATION_HOPS });
    expect(verifyContinueToken(t)).toBeNull();
  });

  it('accepts a token at MAX_CONTINUATION_HOPS - 1 (last allowed hop)', () => {
    const t = signContinueToken({ iat: Date.now(), hop: MAX_CONTINUATION_HOPS - 1 });
    expect(verifyContinueToken(t)?.hop).toBe(MAX_CONTINUATION_HOPS - 1);
  });

  it('returns "" when no secret is configured (fail-closed)', () => {
    delete process.env.OTP_SECRET;
    delete process.env.JWT_SECRET;
    expect(signContinueToken({ iat: Date.now(), hop: 0 })).toBe('');
  });

  it('returns null for malformed tokens', () => {
    expect(verifyContinueToken('not-a-token')).toBeNull();
    expect(verifyContinueToken('')).toBeNull();
    expect(verifyContinueToken('a.b.c')).toBeNull();
    expect(verifyContinueToken('.')).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const t = signContinueToken({ iat: Date.now(), hop: 0 });
    process.env.OTP_SECRET = 'b'.repeat(40);
    expect(verifyContinueToken(t)).toBeNull();
  });

  it('MAX_CONTINUATION_HOPS bounds the chain depth (>=10, <=50)', () => {
    expect(MAX_CONTINUATION_HOPS).toBeGreaterThanOrEqual(10);
    expect(MAX_CONTINUATION_HOPS).toBeLessThanOrEqual(50);
  });
});
