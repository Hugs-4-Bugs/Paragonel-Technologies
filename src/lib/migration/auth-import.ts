/**
 * auth-import.ts — Firebase → Supabase Auth user import utility (Task 4).
 *
 * IMPORTANT — supported API assumption:
 *   The Supabase Auth Admin API (`supabase.auth.admin.createUser`) does NOT
 *   accept a `password_hash` field. Importing a pre-hashed password from
 *   Firebase is therefore NOT supported by the Admin API. The supported path
 *   (verified against the documented `admin.createUser` attributes) is:
 *     - create the user with a freshly generated random password +
 *       `email_confirm: true` (the Firebase-side email-verified state is
 *       preserved), AND
 *     - require the user to reset their password via the OTP flow on first
 *       login (the random password is never shared with the user).
 *
 * This module intentionally does NOT pass `password_hash`. A cutover that
 * needs to preserve the exact Firebase password is blocked on a feature
 * Supabase does not expose via the JS Admin API; document this as a known
 * migration constraint + plan a forced password reset for imported users.
 */
import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthImportResult {
  ok: boolean;
  /** The Supabase Auth user id on success. */
  userId?: string;
  /** Sanitized error message on failure (no credentials / no stack). */
  error?: string;
}

/**
 * Generate a strong random password (32 URL-safe chars). Used only to satisfy
 * `createUser`'s password requirement; the user never sees it and resets via
 * OTP on first login.
 */
export function generateRandomPassword(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Import one Firebase user into Supabase Auth.
 *
 * `attrs.email` must be a valid email. `attrs.emailVerified` (from the
 * Firestore `users/{email}.emailVerified` field) is mapped to
 * `email_confirm`. The Firebase password hash is deliberately NOT forwarded.
 *
 * Never throws — returns `{ ok: false, error }` on any failure.
 */
export async function importAuthUser(
  supabase: SupabaseClient,
  attrs: { email: string; emailVerified?: boolean },
): Promise<AuthImportResult> {
  const email = (attrs.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'A valid email is required.' };
  }

  const password = generateRandomPassword();

  // NOTE: `password_hash` is intentionally NOT included. `createUser` accepts
  // `email`, `password`, `email_confirm`, etc. — not a pre-hashed password.
  // See the module header for the documented constraint.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: attrs.emailVerified === true,
  });

  if (error) {
    // Sanitized: return a generic message to the caller (Supabase error text can
    // echo request context); log a truncated, non-sensitive message server-side.
    console.error('[auth-import] createUser failed:', String(error.message || '').slice(0, 120));
    return { ok: false, error: 'Auth user creation failed.' };
  }
  if (!data?.user?.id) {
    return { ok: false, error: 'createUser returned no user id.' };
  }
  return { ok: true, userId: data.user.id };
}
