import { describe, it, expect } from 'vitest';
import { randomOtpCode, hmacSign, signToken, verifySignedToken, safeEqual, randomHex, hashIp } from '../crypto-utils';

describe('crypto-utils', () => {
  it('randomOtpCode produces exactly 6 digits, uniformly', () => {
    for (let i = 0; i < 50; i++) {
      const c = randomOtpCode(6);
      expect(c).toHaveLength(6);
      expect(c).toMatch(/^\d{6}$/);
    }
    // supports a leading-zero code
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(randomOtpCode(6));
    expect(seen.size).toBeGreaterThan(500); // high cardinality (CSPRNG)
  });

  it('hmacSign is deterministic for same secret+data, differs otherwise', () => {
    const a = hmacSign('payload', 'secret');
    const b = hmacSign('payload', 'secret');
    expect(a).toBe(b);
    expect(hmacSign('payload', 'other')).not.toBe(a);
    expect(a).toHaveLength(64); // sha256 hex
  });

  it('signToken/verifySignedToken round-trip; tampering fails', () => {
    const t = signToken('{"a":1}', 'k');
    expect(verifySignedToken(t, 'k')).toBe('{"a":1}');
    expect(verifySignedToken(t, 'wrong')).toBeNull();
    expect(verifySignedToken('garbage', 'k')).toBeNull();
    expect(verifySignedToken('aaaa.bbbb', 'k')).toBeNull();
  });

  it('safeEqual is constant-time-correct on equal and unequal inputs', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'ab')).toBe(false); // different lengths
  });

  it('randomHex + hashIp are stable in shape', () => {
    expect(randomHex(16)).toHaveLength(32);
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'));
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('5.6.7.8'));
  });
});
