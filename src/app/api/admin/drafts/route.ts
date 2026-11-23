/**
 * /api/admin/drafts — secure server-backed draft persistence (Batch 2 Task 1).
 *
 *   GET    ?type=<jobs|blogPosts|drafts>  — load the caller's draft (cms.read)
 *   POST   { type, data }                  — create/update the caller's draft (cms.create)
 *   DELETE ?type=<...>                     — delete the caller's draft (cms.create) + audit
 *
 * Authorization: every method re-verifies the admin session + RBAC permission
 * via `verifyAdminPermission`. The owner email is ALWAYS taken from the session
 * (`auth.user.email`), never from the request body, so a caller cannot read or
 * mutate another admin's draft. The `drafts` collection has no Firestore rule
 * (default-deny for the client SDK); the Admin SDK bypasses rules, and
 * `src/lib/drafts.ts` re-checks the stored `ownerEmail` on every op.
 *
 * Drafts survive refreshes + are available across devices (doc id is
 * `${type}__${ownerEmail}`). localStorage in `useAutosave` is the offline
 * fallback; this route is the authoritative store.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPermission, serviceUnavailable, logActivityServer } from '@/lib/admin-auth';
import { validateRequestBody, jsonError } from '@/lib/auth/route-helpers';
import { saveDraft, loadDraft, deleteDraft, type DraftType } from '@/lib/drafts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const draftTypeSchema = z.enum(['jobs', 'blogPosts', 'drafts']);
const DRAFT_TYPES_SET = new Set<string>(['jobs', 'blogPosts', 'drafts']);
const saveSchema = z.object({
  type: draftTypeSchema,
  data: z.record(z.unknown()),
});

function typeFromQuery(request: Request): DraftType | null {
  const raw = new URL(request.url).searchParams.get('type');
  return raw && DRAFT_TYPES_SET.has(raw) ? (raw as DraftType) : null;
}

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.read');
  if (!auth.ok) return auth.response;
  const type = typeFromQuery(request);
  if (!type) return jsonError(400, 'Missing or invalid draft type.');
  const r = await loadDraft({ ownerEmail: auth.user.email, type });
  if (!r.ok) {
    if (r.reason === 'not_found') return NextResponse.json({ draft: null });
    if (r.reason === 'forbidden') return jsonError(403, 'Not authorized for this draft.');
    return serviceUnavailable();
  }
  return NextResponse.json({ draft: r.data });
}

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.create');
  if (!auth.ok) return auth.response;
  const parsed = await validateRequestBody(request, saveSchema);
  if (!parsed.ok) return parsed.response;
  const r = await saveDraft({
    ownerEmail: auth.user.email,
    type: parsed.data.type,
    data: parsed.data.data,
  });
  if (!r.ok) {
    if (r.reason === 'forbidden') return jsonError(403, 'Not authorized for this draft.');
    if (r.reason === 'invalid') return jsonError(400, 'Invalid draft payload.');
    return serviceUnavailable();
  }
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.create');
  if (!auth.ok) return auth.response;
  const type = typeFromQuery(request);
  if (!type) return jsonError(400, 'Missing or invalid draft type.');
  const r = await deleteDraft({ ownerEmail: auth.user.email, type });
  if (!r.ok) {
    if (r.reason === 'forbidden') return jsonError(403, 'Not authorized for this draft.');
    return serviceUnavailable();
  }
  await logActivityServer(auth.user, 'delete_draft', 'Draft', type);
  return NextResponse.json({ deleted: true });
}
