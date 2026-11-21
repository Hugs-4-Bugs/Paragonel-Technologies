/**
 * Server-side admin authorization + audit helper (Phase 4, IU-0 slice 1).
 *
 * The Phase 1A/1B model gates only the admin PAGES (middleware JWT cookie).
 * It does NOT protect database mutations, because admin CRUD was performed
 * with the client-side Firebase SDK — so `request.auth` was null for every
 * client write and Firestore rules could not distinguish admin from anonymous.
 *
 * This module is the secure replacement path: every new `/api/admin/**` data
 * route calls `verifyAdmin(request)` to re-verify the JWT server-side (fail
 * closed → 401) before any Admin-SDK operation. The Admin SDK bypasses
 * Firestore rules entirely, so locking the rules (see `firestore.rules`) does
 * not break these routes.
 *
 * Credentials: never handled here. `getAdminDb()` (firebase-admin) owns all
 * credential logic and returns null + 503 when misconfigured. This module
 * only reads the `JWT_SECRET` env var (already used by middleware/auth/me).
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';

export type AdminUser = { email: string; role?: string };

type VerifyOk = { ok: true; user: AdminUser };
type VerifyErr = { ok: false; response: NextResponse };
export type VerifyResult = VerifyOk | VerifyErr;

/** JWT secret from env (>= 32 chars). Null when misconfigured → callers fail closed. */
export function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) return null;
  return new TextEncoder().encode(raw);
}

/**
 * Verify the admin session for an `/api/admin/**` data route.
 *
 * Delegates to `verifySession` (src/lib/auth/sessions.ts), which re-reads the
 * `sessions/{sid}` doc + the `admins/{email}` doc on every call and rejects
 * revoked / suspended / stale-tokenVersion sessions. This means the existing
 * CMS routes (jobs/blog/services/leads/…) automatically inherit session
 * revocation, account suspension, and (via the permission argument) RBAC.
 *
 * Returns `{ok, user:{email, role}}` on success or a ready 401/403/500
 * NextResponse on failure — preserving the original contract so existing
 * callers need no changes. The `role` here is the authoritative role read from
 * the account doc, not the JWT claim.
 */
export async function verifyAdmin(request: Request): Promise<VerifyResult> {
  const r = await verifySession(request, undefined, 'admin');
  if (!r.ok) return { ok: false, response: r.response };
  return { ok: true, user: { email: r.user.email, role: r.user.role } };
}

/**
 * Write an audit entry server-side via the Admin SDK. The Admin SDK bypasses
 * Firestore rules, so this keeps working after `adminActivityLogs` is locked.
 *
 * Unlike the old client `logActivity`, this does NOT swallow errors silently —
 * it logs them. A failed audit log must never block a successful mutation
 * (callers await it after the data write succeeds), but it must surface.
 */
export async function logActivityServer(
  user: AdminUser,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    console.warn('[audit] admin SDK not configured; activity not logged.');
    return;
  }
  try {
    await db.collection('adminActivityLogs').add({
      adminEmail: user.email,
      action,
      resourceType,
      resourceId,
      timestamp: Timestamp.now(),
    });
  } catch (e) {
    // Surface, but do not throw — the mutation already succeeded.
    console.error('[audit] server activity log failed:', e instanceof Error ? e.message : e);
  }
}

/* -------------------------------------------------------------------------- */
/* Response serialization                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Convert a Firestore value into a JSON-safe shape that matches what the old
 * client SDK hooks returned (so converted admin pages need no UI changes):
 *   - Timestamp  → { seconds, nanoseconds }
 *   - Date       → { seconds, nanoseconds }
 *   - arrays/objects → recursed
 * firebase-admin v14 Timestamp has no toJSON(), so we normalize explicitly.
 */
export function toJsonValue(v: unknown): unknown {
  if (v instanceof Timestamp) {
    return { seconds: v.seconds, nanoseconds: v.nanoseconds };
  }
  if (v instanceof Date) {
    return { seconds: Math.floor(v.getTime() / 1000), nanoseconds: 0 };
  }
  if (Array.isArray(v)) {
    return v.map(toJsonValue);
  }
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = toJsonValue(val);
    }
    return out;
  }
  return v;
}

/** Serialize a Firestore doc snapshot into `{ id, ...fields }` (JSON-safe). */
export function serializeDoc(
  snap: { id: string; data: () => Record<string, unknown> | undefined }
): Record<string, unknown> {
  const data = snap.data() || {};
  const out: Record<string, unknown> = { id: snap.id };
  for (const [k, v] of Object.entries(data)) {
    out[k] = toJsonValue(v);
  }
  return out;
}

/** 503 response used by every data route when the Admin SDK is unavailable. */
export function serviceUnavailable(): NextResponse {
  return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
}
