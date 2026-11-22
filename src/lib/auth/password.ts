/**
 * password.ts — password hashing + strength validation.
 *
 * Uses bcrypt (via bcryptjs, 10 rounds). Passwords are NEVER stored in
 * plaintext, NEVER logged, NEVER returned in API responses. A password hash
 * in Firestore is the only representation.
 */
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

/** Minimum password policy. Enforced on set/change/reset. */
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requiresLetter: true,
  requiresNumber: true,
} as const;

export type PasswordPolicyError =
  | 'too_short' | 'too_long' | 'missing_letter' | 'missing_number';

/** Validate a password against policy. Returns null if OK, else an error code. */
export function validatePassword(pw: string): PasswordPolicyError | null {
  if (pw.length < PASSWORD_POLICY.minLength) return 'too_short';
  if (pw.length > PASSWORD_POLICY.maxLength) return 'too_long';
  if (PASSWORD_POLICY.requiresLetter && !/[a-zA-Z]/.test(pw)) return 'missing_letter';
  if (PASSWORD_POLICY.requiresNumber && !/[0-9]/.test(pw)) return 'missing_number';
  return null;
}

/** Human-readable policy message for API/UI. */
export function passwordPolicyMessage(err: PasswordPolicyError): string {
  return {
    too_short: `Password must be at least ${PASSWORD_POLICY.minLength} characters.`,
    too_long: `Password must be at most ${PASSWORD_POLICY.maxLength} characters.`,
    missing_letter: 'Password must contain at least one letter.',
    missing_number: 'Password must contain at least one number.',
  }[err];
}

/** Hash a password (bcrypt). Throws if bcrypt is unavailable. */
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/** Verify a password against a stored bcrypt hash. Constant-time inside bcrypt. */
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(pw, hash);
  } catch {
    return false;
  }
}
