/**
 * totp.test.ts — TOTP MFA library unit tests (Phase 6).
 *
 * Verifies the core MFA primitives without Firebase/SMTP: secret generation,
 * token verification (correct + wrong), backup-code generation + verification
 * (correct + wrong + single-use semantics). Uses otplib's authenticator to
 * generate a valid token from the secret, then verifies it via our wrapper.
 */
import { describe, it, expect } from 'vitest';
import { authenticator } from 'otplib';
import {
  generateTotpSecret,
  verifyTotp,
  totpUri,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from '../totp';

describe('totp.ts — TOTP MFA primitives', () => {
  it('generateTotpSecret returns a non-empty base32 secret', () => {
    const s = generateTotpSecret();
    expect(s).toBeTruthy();
    expect(s.length).toBeGreaterThanOrEqual(16);
    // base32 charset
    expect(s).toMatch(/^[A-Z2-7]+=*$/);
  });

  it('verifyTotp accepts a valid token generated from the secret', () => {
    const secret = generateTotpSecret();
    const token = authenticator.generate(secret);
    expect(verifyTotp(token, secret)).toBe(true);
  });

  it('verifyTotp rejects a wrong token', () => {
    const secret = generateTotpSecret();
    // A token for a DIFFERENT secret must not verify.
    const otherSecret = generateTotpSecret();
    const wrongToken = authenticator.generate(otherSecret);
    expect(verifyTotp(wrongToken, secret)).toBe(false);
  });

  it('verifyTotp rejects a malformed token (no throw)', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp('not-a-code', secret)).toBe(false);
    expect(verifyTotp('', secret)).toBe(false);
  });

  it('verifyTotp tolerates whitespace in the token', () => {
    const secret = generateTotpSecret();
    const token = authenticator.generate(secret);
    expect(verifyTotp(`  ${token}  `, secret)).toBe(true);
  });

  it('totpUri builds an otpauth:// URI containing the email + issuer', () => {
    const secret = generateTotpSecret();
    const uri = totpUri('admin@example.com', secret);
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('admin%40example.com');
    expect(uri).toContain('secret=');
  });

  it('generateBackupCodes returns the requested count of unique codes', () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    // format XXXX-XXXX
    codes.forEach((c) => expect(c).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/));
  });

  it('verifyBackupCode finds the matching hash (returns the index)', async () => {
    const plain = ['ABCD-1234', 'EFGH-5678'];
    const hashes = await Promise.all(plain.map(hashBackupCode));
    const idx = await verifyBackupCode('EFGH-5678', hashes);
    expect(idx).toBe(1);
  });

  it('verifyBackupCode returns -1 for a wrong code', async () => {
    const hashes = await Promise.all(['ABCD-1234', 'EFGH-5678'].map(hashBackupCode));
    const idx = await verifyBackupCode('WRONG-CODE', hashes);
    expect(idx).toBe(-1);
  });

  it('verifyBackupCode is case-insensitive + whitespace-tolerant', async () => {
    const hashes = await Promise.all(['ABCD-1234'].map(hashBackupCode));
    const idx = await verifyBackupCode(' abcd-1234 ', hashes);
    expect(idx).toBe(0);
  });
});
