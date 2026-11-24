/**
 * GET / PATCH /api/admin/jobs/matching-threshold — admin-configurable global
 * matching-threshold floor (Prompt §5.2).
 *
 * GET (cms.read — any admin): returns the current global floor + bounds + canEdit
 *   (canEdit = the caller is super_admin, mirroring the Supabase RLS
 *   `settings_write_super` policy).
 * PATCH (super_admin only): validates minimum_matching_percentage ∈ [75,100],
 *   persists via setGlobalMatchingThreshold (Firestore `app_settings` now; the
 *   Supabase `app_settings` row of the same key is upserted by migration 0009
 *   for the cutover), invalidates the in-memory cache, and writes an audit entry.
 *
 * The setting is the FLOOR — candidate-level thresholds are clamped UP to it at
 * resolution time (resolveMatchingThreshold) and can never bypass it. Default 80,
 * min 75, max 100; an admin may raise to 80+ up to 100 but can never lower below 75.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPermission } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  getGlobalMatchingThreshold,
  setGlobalMatchingThreshold,
  invalidateGlobalMatchingThresholdCache,
} from '@/lib/matching/global-threshold';
import { MIN_THRESHOLD, MAX_THRESHOLD, DEFAULT_MATCHING_THRESHOLD } from '@/lib/matching/preferences';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const patchSchema = z.object({
  minimum_matching_percentage: z
    .coerce
    .number()
    .int(`Threshold must be an integer between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`)
    .min(MIN_THRESHOLD, `Threshold must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`)
    .max(MAX_THRESHOLD, `Threshold must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`),
});

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.read');
  if (!auth.ok) return auth.response;
  const value = await getGlobalMatchingThreshold();
  return NextResponse.json({
    minimum_matching_percentage: value,
    min: MIN_THRESHOLD,
    max: MAX_THRESHOLD,
    default: DEFAULT_MATCHING_THRESHOLD,
    canEdit: auth.user.role === 'super_admin',
  });
}

export async function PATCH(request: Request) {
  // Super-admin only — mirrors the Supabase RLS `settings_write_super` policy.
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;
  if (auth.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin authorization required.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  try {
    const value = await setGlobalMatchingThreshold(parsed.data.minimum_matching_percentage);
    invalidateGlobalMatchingThresholdCache();

    // Audit log (same pattern as other admin mutations — adminActivityLogs).
    const db = getAdminDb();
    if (db) {
      try {
        await db.collection('adminActivityLogs').add({
          actor: auth.user.email,
          action: 'matching_threshold_update',
          detail: `Global matching threshold floor set to ${value}%`,
          ts: new Date().toISOString(),
        });
      } catch {
        // non-fatal — the setting is already persisted; a failed audit must not revert it
      }
    }

    return NextResponse.json({
      minimum_matching_percentage: value,
      min: MIN_THRESHOLD,
      max: MAX_THRESHOLD,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update threshold.';
    const status = msg.includes('Service unavailable') ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
