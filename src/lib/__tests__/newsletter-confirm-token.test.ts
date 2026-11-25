/**
 * newsletter-confirm-token.test.ts — double-opt-in confirmation token (Batch 2
 * Task 5). Verifies sign/verify round-trip, tamper rejection, email-binding,
 * cross-purpose isolation (a confirm token cannot be replayed as an unsubscribe
 * token and vice versa), and fail-closed behavior with no secret.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  signNewsletterConfirmToken,
  verifyNewsletterConfirmToken,
  newsletterConfirmUrl,
} from '@/lib/newsletter/confirm-token';
import {
  signNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from '@/lib/newsletter/unsubscribe';

beforeAll(() => {
  process.env.OTP_SECRET = 'test-secret-min-32-chars-long-aaaaaaa';
});

describe('newsletter confirm token', () => {
  it('round-trips: sign then verify returns the bound email', () => {
    const t = signNewsletterConfirmToken('Sub@Example.com');
    expect(t).toBeTruthy();
    expect(verifyNewsletterConfirmToken(t)).toBe('sub@example.com');
  });

  it('rejects a tampered signature', () => {
    const t = signNewsletterConfirmToken('a@b.com');
    const tampered = t.slice(0, t.length - 2) + 'xx';
    expect(verifyNewsletterConfirmToken(tampered)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifyNewsletterConfirmToken('not-a-token')).toBeNull();
    expect(verifyNewsletterConfirmToken('')).toBeNull();
    expect(verifyNewsletterConfirmToken('a.b.c')).toBeNull();
  });

  it('is bound to the email: a token for A does not verify as B', () => {
    const ta = signNewsletterConfirmToken('a@b.com');
    // Swapping the email part against A's signature fails.
    const [sig] = ta.split('.').slice(1);
    const forged = `${Buffer.from('c@d.com').toString('base64url')}.${sig}`;
    expect(verifyNewsletterConfirmToken(forged)).toBeNull();
  });

  it('cross-purpose isolation: a confirm token is NOT valid as an unsubscribe token', () => {
    const confirmT = signNewsletterConfirmToken('a@b.com');
    expect(verifyNewsletterUnsubscribeToken(confirmT)).toBeNull();
  });

  it('cross-purpose isolation: an unsubscribe token is NOT valid as a confirm token', () => {
    const unsubT = signNewsletterUnsubscribeToken('a@b.com');
    expect(verifyNewsletterConfirmToken(unsubT)).toBeNull();
  });

  it('fails closed when no secret is configured (sign returns "", verify returns null)', () => {
    const prev = process.env.OTP_SECRET;
    const prevJwt = process.env.JWT_SECRET;
    delete process.env.OTP_SECRET;
    delete process.env.JWT_SECRET;
    try {
      expect(signNewsletterConfirmToken('a@b.com')).toBe('');
      expect(verifyNewsletterConfirmToken('anything')).toBeNull();
    } finally {
      process.env.OTP_SECRET = prev;
      process.env.JWT_SECRET = prevJwt;
    }
  });

  it('newsletterConfirmUrl builds a URL containing the token', () => {
    const url = newsletterConfirmUrl('a@b.com', 'https://app.example.com');
    expect(url).toMatch(/^https:\/\/app\.example\.com\/api\/newsletter\/confirm\?token=/);
  });
});
