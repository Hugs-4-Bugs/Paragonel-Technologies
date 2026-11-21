import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePassword } from '../password';

describe('password (Part E/F)', () => {
  it('hashes + verifies round-trip; plaintext never equals hash', async () => {
    const pw = 'Sup3rSecret!';
    const h = await hashPassword(pw);
    expect(h).not.toBe(pw);
    expect(h.startsWith('$2')).toBe(true);
    expect(await verifyPassword(pw, h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });

  it('validatePassword rejects weak passwords, accepts strong ones', () => {
    expect(validatePassword('short')).toBe('too_short');
    expect(validatePassword('allletters')).toBe('missing_number');
    expect(validatePassword('12345678')).toBe('missing_letter');
    expect(validatePassword('Longenough1')).toBeNull();
    expect(validatePassword('Aa1' + 'x'.repeat(200))).toBe('too_long');
  });
});
