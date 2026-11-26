'use client';

/**
 * DEPRECATED — client audit helper (no-op).
 *
 * Audit records are now SERVER-GENERATED ONLY (src/lib/audit-log.ts ->
 * `writeAuditLog`, called from route handlers after a verified mutation). The
 * client must NOT write audit entries: a browser cannot be trusted to supply
 * the actor identity, role, timestamp or event type, and allowing client writes
 * let a read-only `viewer`-role admin append arbitrary entries.
 *
 * The previous `POST /api/admin/activity` endpoint has been removed. This helper
 * is retained as a no-op so any stale import still compiles, but it writes
 * nothing. New audit calls must be added server-side in the route that performs
 * the mutation (see `writeAuditLog` / `logActivityServer`).
 */
export async function logActivity(
  adminEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
): Promise<void> {
  // Signature retained for backward compatibility (no live callers remain), but
  // the params are intentionally unused — void them to satisfy no-unused-vars.
  void adminEmail;
  void action;
  void resourceType;
  void resourceId;
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      '[audit] client logActivity() is a deprecated no-op; audit records are server-generated only.',
    );
  }
  return Promise.resolve();
}
