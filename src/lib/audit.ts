'use client';

/**
 * Client audit helper (Phase 4, IU-0 slice 1).
 *
 * Previously this wrote directly to the `adminActivityLogs` Firestore
 * collection with the client SDK. With `adminActivityLogs` now locked
 * (`allow read, write: if false` for clients), it instead POSTs to the
 * server-side `/api/admin/activity` route, which verifies the admin JWT and
 * writes via the Admin SDK.
 *
 * Signature is unchanged so existing callers (blog/jobs/leads/applications
 * admin pages) need no edits beyond removing the local call where the
 * mutation itself is now server-side.
 *
 * Errors are surfaced to the console but never thrown — audit logging must
 * not crash a successful admin action.
 */
export async function logActivity(
  adminEmail: string,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  try {
    await fetch('/api/admin/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, resourceType, resourceId }),
    });
  } catch (e) {
    // Surface, but never block the calling admin action.
    console.error('[audit] failed to post activity:', e);
  }
}
