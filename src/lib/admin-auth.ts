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
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth/sessions';
import { writeAuditLog } from '@/lib/audit-log';
import type { Permission } from '@/lib/auth/rbac';

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
 * Verify the admin session AND require a specific RBAC permission.
 *
 * Same `{ok, user:{email,role}} | {ok:false, response}` contract as
 * `verifyAdmin`, so CMS mutation handlers can swap
 * `verifyAdmin(request)` → `verifyAdminPermission(request, 'cms.create')`
 * with no other code changes. Use this for every create/update/delete/publish
 * mutation so a `viewer`-role (read-only) admin cannot write — closing the
 * privilege-escalation gap where `verifyAdmin` (no permission check) let any
 * active admin mutate every CMS collection. `verifyAdmin` remains correct for
 * read/list handlers (viewer has `cms.read`; jobs reads have no dedicated read
 * perm in the RBAC model and listing is non-sensitive).
 */
export async function verifyAdminPermission(
  request: Request,
  perm: Permission
): Promise<VerifyResult> {
  const r = await verifySession(request, perm, 'admin');
  if (!r.ok) return { ok: false, response: r.response };
  return { ok: true, user: { email: r.user.email, role: r.user.role } };
}

/**
 * On-demand ISR revalidation after an admin content mutation, so the public
 * pages reflect the change immediately instead of waiting up to `revalidate=60s`
 * (the ISR interval on /blog, /blog/[slug], /careers, /services). Called from
 * /api/admin/** route handlers after a successful Firestore write. The dynamic
 * blog slug segment is purged with type 'page' so every cached article page is
 * regenerated on next request. Errors are logged, never thrown — a failed purge
 * must not turn a successful mutation into a 500 (the data is already persisted
 * and will surface on the next ISR tick within 60s).
 */
export function revalidatePublicContent(kind: 'blog' | 'jobs' | 'services' | 'testimonials' | 'clientProjects' | 'techEcosystem'): void {
  try {
    if (kind === 'blog') {
      revalidatePath('/blog');
      revalidatePath('/blog/[slug]', 'page'); // purge all cached article pages
      revalidatePath('/'); // homepage "From the blog" section
    } else if (kind === 'jobs') {
      revalidatePath('/careers');
      revalidatePath('/careers/[id]', 'page'); // purge all cached job detail pages
    } else if (kind === 'services') {
      revalidatePath('/services');
    } else if (kind === 'testimonials') {
      revalidatePath('/testimonials');
      revalidatePath('/portfolio');
      revalidatePath('/'); // homepage testimonials marquee section
    } else if (kind === 'clientProjects') {
      revalidatePath('/testimonials');
      revalidatePath('/portfolio');
      revalidatePath('/');
    } else if (kind === 'techEcosystem') {
      revalidatePath('/our-product');
    }
  } catch (e) {
    console.error('[revalidate] failed:', e instanceof Error ? e.message : e);
  }
}

/**
 * Write an audit entry server-side via the Admin SDK. The Admin SDK bypasses
 * Firestore rules, so this keeps working after `adminActivityLogs` is locked.
 *
 * This now delegates to `writeAuditLog` (src/lib/audit-log.ts) so every record
 * carries the enriched, SERVER-generated schema (eventId / actorId / actorRole /
 * actorTier / eventType / outcome / timestamp / correlationId / metadata) in
 * ADDITION to the legacy fields (`adminEmail` / `action` / `resourceType` /
 * `resourceId` / `timestamp`) that the existing Activity page reads. Existing
 * call sites need no changes.
 *
 * The actor (`user`) comes from `verifyAdmin` / `verifyAdminPermission` (the
 * verified session) — never from the request body. A failed audit log must
 * never block a successful mutation (callers await it after the data write
 * succeeds), but it must surface.
 */
export async function logActivityServer(
  user: AdminUser,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  await writeAuditLog({
    actor: { id: user.email, role: user.role ?? 'admin', tier: 'admin' },
    eventType: action,
    entityType: resourceType,
    entityId: resourceId,
    outcome: 'success',
  });
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

/** Serialize a Firestore doc snapshot into `{ id, ...fields }` (JSON-safe).
 * Accepts any snapshot shape whose `data()` returns something (QueryDocumentSnapshot
 * OR DocumentSnapshot) — the Firestore return type is `DocumentData | undefined`,
 * which doesn't structurally satisfy a narrower `Record<string, unknown>` return,
 * so we accept `unknown` + cast inside. This removes the need for `as any` casts
 * at every call site. */
export function serializeDoc(
  snap: { id: string; data: () => unknown }
): Record<string, unknown> {
  const raw = snap.data();
  const data: Record<string, unknown> = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
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
