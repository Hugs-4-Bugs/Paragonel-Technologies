/**
 * audit-logs.ts — Supabase-backed admin audit log (Issue 1 incremental migration).
 *
 * The SECOND runtime consumer of the Supabase primary database. Writes admin
 * activity to the `audit_logs` table (0001_initial_schema.sql:365) via the server
 * service-role client (getSupabaseServer). The service-role key bypasses RLS, so
 * the route layer enforces authorization (the caller is already super_admin-
 * verified before this is invoked — mirrors the `audit_logs` RLS policy at
 * 0002_rls_policies.sql which restricts reads to super_admin + writes to the
 * service role).
 *
 * Fail-closed: returns false when Supabase is not configured or the write fails.
 * The sole caller (the matching-threshold PATCH route) treats a failed audit as
 * NON-FATAL — the setting is already persisted; a failed audit must never revert
 * it. This is NOT a silent Firestore fallback: the audit write is real Supabase
 * against the real table; the false return only governs the unconfigured/error
 * case, + the caller logs nothing sensitive.
 *
 * This replaces the transitional Firestore `adminActivityLogs` write that was
 * the threshold route's last Firestore dependency (Issue 1 — removes one route
 * from the 65 Firestore-dependent set). The remaining 64 routes are documented
 * in supabase/MIGRATION_GUIDE.md by tier, pending the full cutover.
 */
import { getSupabaseServer } from '../server';
import type { Database } from '../types';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

/**
 * Insert an admin audit-log entry. Returns true on success, false if Supabase is
 * unconfigured or the write failed (non-fatal — caller must not revert the
 * audited action on a false return).
 *
 * @param action  — e.g. 'matching_threshold_update' (NOT NULL)
 * @param actorEmail — the admin's email (actor_id uuid is null when unknown;
 *                   Supabase Auth cutover will populate actor_id from the session)
 * @param detail  — non-sensitive jsonb context (e.g. {"value": 80})
 * @param targetType — e.g. 'app_settings' (optional)
 * @param targetId   — e.g. 'matching_threshold_floor' (optional)
 */
export async function insertAuditLog(
  action: string,
  actorEmail: string | null,
  detail?: Record<string, unknown> | null,
  targetType?: string | null,
  targetId?: string | null,
): Promise<boolean> {
  const sb = getSupabaseServer();
  if (!sb) return false;
  try {
    const row: AuditLogInsert = {
      action,
      actor_email: actorEmail ?? null,
      actor_id: null, // populated after Supabase Auth cutover (session → profiles.id)
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      detail: (detail ?? null) as AuditLogInsert['detail'],
    };
    // `as never` works around a supabase-js type-inference quirk (same as the
    // app-settings upsert site): the typed `.insert()` generic resolves to
    // `never[]` for tables with optional/jsonb columns, rejecting a valid Insert
    // row. `never` is the bottom type (assignable to any type, including
    // `never[]`), so the cast is sound + the runtime value is the correctly-shaped
    // Insert row. app-settings.test.ts validates the real row shape.
    const { error } = await sb.from('audit_logs').insert(row as never);
    return !error;
  } catch {
    return false;
  }
}

/** Whether the Supabase server client is configured (for the health/readiness check). */
export function auditLogsStoreConfigured(): boolean {
  return getSupabaseServer() !== null;
}
