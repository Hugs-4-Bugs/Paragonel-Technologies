/**
 * server.ts — Supabase server client (service role).
 *
 * The service-role key bypasses RLS entirely. Use this ONLY in server-side code
 * (Next.js API routes, server components, server actions) for trusted operations
 * that must read/write across tenants (the matching pipeline, admin operations,
 * the migration script, signed-URL issuance). NEVER expose the service-role key
 * to the browser — it is not a NEXT_PUBLIC_* variable.
 *
 * Fail-closed: returns null if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
 * missing. Callers check for null + return 503 (consistent with the existing
 * firebase-admin getAdminDb() pattern, so the eventual route cutover is
 * mechanical: swap `const db = getAdminDb(); if (!db) return 503;` for
 * `const sb = getSupabaseServer(); if (!sb) return 503;`).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let cached: SupabaseClient<Database> | null = null;
let cachedNull = false;

export function getSupabaseServer(): SupabaseClient<Database> | null {
  if (cached) return cached;
  if (cachedNull) return null; // avoid re-reading env on every call after a miss
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !url.trim() || !key || !key.trim()) {
    cachedNull = true;
    return null;
  }
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Whether the server client is configured (for health checks / env validation). */
export function supabaseServerConfigured(): boolean {
  return getSupabaseServer() !== null;
}

/**
 * Reset the cached client (for tests that change env vars between cases, and
 * for the migration script which may point at different targets).
 */
export function resetSupabaseServerCache(): void {
  cached = null;
  cachedNull = false;
}
