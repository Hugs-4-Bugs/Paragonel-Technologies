/**
 * totp.ts — TOTP (RFC 6238) MFA for admin accounts (Phase 3).
 *
 * Uses otplib (authenticator) for secret generation + 6-digit token
 * verification, + `qrcode` for the QR data URL shown in the enrollment UI.
 * Backup codes are generated + bcrypt-hashed for recovery (each single-use).
 *
 * Secrets are stored in the admin doc (admins/{email}.mfa.totpSecret) — NEVER
 * sent to the browser after enrollment. The QR + secret is returned ONCE during
 * enrollment (before verification) so the admin can scan it with an
 * authenticator app (Google Authenticator, Authy, 1Password, etc.); after
 * verify-enroll, only the plaintext backup codes are returned (once).
 *
 * Backup codes: 10 single-use codes (format XXXX-XXXX), bcrypt-hashed. On
 * login, a backup code may be entered INSTEAD of the TOTP code; the matched
 * hash is removed (single-use). This is the recovery path if the
 * authenticator device is lost.
 */
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { hashPassword, verifyPassword } from './password';

// 6-digit codes, 30s step, SHA-1 (RFC 6238 default — universally compatible
// with authenticator apps). Allow ±1 step drift (±30s) for clock skew.
authenticator.options = { window: 1 };

const ISSUER = 'Paragonel Admin';

/** Generate a new base32 TOTP secret (20 bytes / 32 base32 chars). */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/** Build the otpauth:// URI for the authenticator app. */
export function totpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

/** Generate a QR code data URL (PNG) for the otpauth URI. */
export async function qrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { width: 240, margin: 1 });
}

/** Verify a 6-digit TOTP token against the secret. Returns false on any error. */
export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s+/g, ''), secret });
  } catch {
    return false;
  }
}

/** Generate n single-use backup codes (format: XXXX-XXXX, uppercase). */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const seg = () =>
      Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0').slice(0, 4);
    codes.push(`${seg()}-${seg()}`);
  }
  return codes;
}

/** Hash a backup code (bcrypt) for storage. */
export async function hashBackupCode(code: string): Promise<string> {
  return hashPassword(code);
}

/**
 * Verify a backup code against a list of bcrypt hashes. Returns the index of
 * the matched hash (so the caller can remove it — single-use), or -1.
 */
export async function verifyBackupCode(
  code: string,
  hashes: string[],
): Promise<number> {
  const clean = code.replace(/\s+/g, '').toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await verifyPassword(clean, hashes[i])) return i;
  }
  return -1;
}
