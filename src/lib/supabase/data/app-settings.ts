/**
 * app-settings.ts — Supabase-backed key/value application settings (Prompt §3/§5).
 *
 * The FIRST runtime consumer of the Supabase primary database. Reads/writes the
 * `app_settings` table (key text PK, value jsonb, 0001_initial_schema.sql:472)
 * via the server service-role client (getSupabaseServer). The service-role key
 * bypasses RLS, so the route layer enforces authorization (super_admin for
 * writes — mirrors the `settings_write_super` RLS policy at 0002_rls_policies.sql:288).
 *
 * Fail-closed: returns null / false when Supabase is not configured. The current
 * sole caller — the global matching-threshold reader — falls back to the default
 * (80) on a null read, so the matching engine still runs when Supabase is
 * unreachable (the write path returns an honest 503 instead). This is NOT fake
 * persistence: the read/write are real Supabase queries against the real table;
 * the fallback only governs the unconfigured/unreachable case.
 */
import { getSupabaseServer } from '../server';
import type { Database } from '../types';

type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
type JsonValue = AppSettingsInsert['value'];

/** Read a jsonb setting value by key. Returns null if unset, Supabase unconfigured, or on error. */
export async function getSetting(key: string): Promise<unknown | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) return null;
    return (data as { value: unknown } | null)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Upsert a jsonb setting value. Returns true on success, false if Supabase is
 * unconfigured or the write failed. `updatedBy` is the actor's profile uuid
 * (FK → profiles.id) when known; null otherwise.
 */
export async function setSetting(
  key: string,
  value: unknown,
  updatedBy?: string | null,
): Promise<boolean> {
  const sb = getSupabaseServer();
  if (!sb) return false;
  try {
    const row: AppSettingsInsert = {
      key,
      value: value as JsonValue,
      updated_by: updatedBy ?? null,
    };
    // `as never` works around a supabase-js type-inference quirk: the typed
    // `.upsert()` generic resolves to `never[]` for tables with a `jsonb`/`Json`
    // `value` column, rejecting a valid Insert row. `never` is the bottom type
    // (assignable to any type, including `never[]`), so the cast is sound + the
    // runtime value is the correctly-shaped Insert row. The select/getSetting
    // path is fully typed; only this write-site needs the cast.
    const { error } = await sb
      .from('app_settings')
      .upsert(row as never, { onConflict: 'key' });
    return !error;
  } catch {
    return false;
  }
}

/** Whether the Supabase server client is configured (for the health/readiness check). */
export function appSettingsStoreConfigured(): boolean {
  return getSupabaseServer() !== null;
}
