/**
 * unsubscribe.test.ts — signed token one-click unsubscribe (Prompt 05R §9).
 * Verifies the token is bound to one email (cannot modify another account),
 * rejects tampering, and fails closed when no secret is configured.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signUnsubscribeToken, verifyUnsubscribeToken, unsubscribeUrl } from '../unsubscribe';

const SECRET = 'test-otp-secret-for-unsubscribe-hmac-signing-0123456789';

describe('unsubscribe token (Prompt 05R §9)', () => {
  beforeEach(() => { process.env.OTP_SECRET = SECRET; });
  afterEach(() => { delete process.env.OTP_SECRET; });

  it('sign + verify round-trip returns the bound email', () => {
    const t = signUnsubscribeToken('Jane@Example.com');
    expect(t).toBeTruthy();
    expect(verifyUnsubscribeToken(t)).toBe('jane@example.com'); // lowercased
  });

  it('a token for candidate A does NOT verify as candidate B', () => {
    const tA = signUnsubscribeToken('alice@example.com');
    expect(verifyUnsubscribeToken(tA)).toBe('alice@example.com');
    expect(verifyUnsubscribeToken(tA)).not.toBe('bob@example.com');
  });

  it('rejects a tampered token', () => {
    const t = signUnsubscribeToken('alice@example.com');
    const tampered = t.slice(0, -2) + 'XX';
    expect(verifyUnsubscribeToken(tampered)).toBe(null);
  });

  it('rejects a token whose email part is swapped (signature bound to email)', () => {
    const tA = signUnsubscribeToken('alice@example.com');
    const tB = signUnsubscribeToken('bob@example.com');
    // Swap the email prefix of B onto A's signature -> must not verify.
    const partsA = tA.split('.');
    const partsB = tB.split('.');
    const franken = partsB[0] + '.' + partsA[1];
    expect(verifyUnsubscribeToken(franken)).toBe(null);
  });

  it('returns null for malformed input', () => {
    expect(verifyUnsubscribeToken('')).toBe(null);
    expect(verifyUnsubscribeToken('not-a-token')).toBe(null);
    expect(verifyUnsubscribeToken('a.b.c')).toBe(null);
  });

  it('fails closed when no secret is configured (sign returns "", verify null)', () => {
    delete process.env.OTP_SECRET;
    delete process.env.JWT_SECRET;
    expect(signUnsubscribeToken('alice@example.com')).toBe('');
    expect(verifyUnsubscribeToken('anything')).toBe(null);
  });

  it('unsubscribeUrl builds a full URL when a secret is set', () => {
    const url = unsubscribeUrl('alice@example.com', 'http://localhost:3000');
    expect(url).toContain('http://localhost:3000/api/job-alerts/unsubscribe?token=');
    expect(url).toContain(encodeURIComponent(signUnsubscribeToken('alice@example.com')));
  });
});
