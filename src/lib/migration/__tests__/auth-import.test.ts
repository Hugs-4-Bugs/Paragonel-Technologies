/**
 * auth-import.test.ts — Supabase Auth user-import coverage (Task 4).
 *
 * Verifies the utility uses the SUPPORTED `admin.createUser` attributes (email,
 * password, email_confirm) and does NOT pass `password_hash` (which the Supabase
 * Auth Admin API does not accept). The SupabaseClient is mocked.
 */
import { describe, it, expect, vi } from 'vitest';
import { importAuthUser, generateRandomPassword } from '../auth-import';
import type { SupabaseClient } from '@supabase/supabase-js';

type CreateUserAttrs = {
  email?: string;
  password?: string;
  email_confirm?: boolean;
  password_hash?: string;
  [k: string]: unknown;
};

function mockSupabase(impl: (attrs: CreateUserAttrs) => { data: { user?: { id: string } } | null; error: { message: string } | null }) {
  const createUser = vi.fn(impl);
  const client = { auth: { admin: { createUser } } } as unknown as SupabaseClient;
  return { client, createUser };
}

describe('generateRandomPassword', () => {
  it('produces a strong, URL-safe string of >= 32 chars', () => {
    const pw = generateRandomPassword();
    expect(pw.length).toBeGreaterThanOrEqual(32);
    expect(/^[A-Za-z0-9_-]+$/.test(pw)).toBe(true);
  });
  it('is random (two calls differ)', () => {
    expect(generateRandomPassword()).not.toBe(generateRandomPassword());
  });
});

describe('importAuthUser', () => {
  it('creates the user with email + password + email_confirm and NO password_hash', async () => {
    const { client, createUser } = mockSupabase(() => ({
      data: { user: { id: 'supa-user-1' } },
      error: null,
    }));
    const r = await importAuthUser(client, { email: 'A@B.com', emailVerified: true });
    expect(r.ok).toBe(true);
    expect(r.userId).toBe('supa-user-1');
    const attrs = createUser.mock.calls[0][0] as CreateUserAttrs;
    expect(attrs.email).toBe('a@b.com'); // normalized to lowercase
    expect(typeof attrs.password).toBe('string');
    expect(attrs.password!.length).toBeGreaterThanOrEqual(32);
    expect(attrs.email_confirm).toBe(true);
    // The critical assertion: password_hash is NEVER forwarded.
    expect(attrs.password_hash).toBeUndefined();
  });

  it('sets email_confirm=false when the source email was not verified', async () => {
    const { client, createUser } = mockSupabase(() => ({ data: { user: { id: 'u' } }, error: null }));
    await importAuthUser(client, { email: 'a@b.com', emailVerified: false });
    expect((createUser.mock.calls[0][0] as CreateUserAttrs).email_confirm).toBe(false);
  });

  it('rejects an invalid email before calling the Admin API', async () => {
    const { client, createUser } = mockSupabase(() => ({ data: null, error: null }));
    const r = await importAuthUser(client, { email: 'not-an-email' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns a sanitized error on createUser failure (no stack/credentials leak)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = mockSupabase(() => ({
      data: null,
      error: { message: 'User already registered [secret: should-not-leak]' },
    }));
    const r = await importAuthUser(client, { email: 'a@b.com' });
    expect(r.ok).toBe(false);
    // Caller sees only a generic message — no Supabase error text / secret leak.
    expect(r.error).toBe('Auth user creation failed.');
    expect(JSON.stringify(r)).not.toContain('should-not-leak');
    expect(JSON.stringify(r)).not.toContain('User already registered');
    errSpy.mockRestore();
  });

  it('returns an error when createUser returns no user id', async () => {
    const { client } = mockSupabase(() => ({ data: { user: null }, error: null }));
    const r = await importAuthUser(client, { email: 'a@b.com' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });
});
