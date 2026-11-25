/**
 * client.ts — Supabase browser client (anon key, RLS-enforced).
 *
 * Used by client components that need direct read access to public data (e.g.
 * published jobs) or that interact with Supabase Auth (signIn, signUp, signOut,
 * verifyOtp). All access is subject to RLS policies — the anon key cannot read
 * private data regardless of what the client requests.
 *
 * The anon/publishable key is safe to expose to the browser (NEXT_PUBLIC_*).
 * The service-role key is NEVER imported here.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let cached: SupabaseClient<Database> | null = null;

export function getSupabaseBrowser(): SupabaseClient<Database> | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}
