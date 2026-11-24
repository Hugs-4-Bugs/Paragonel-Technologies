/**
 * global-threshold.ts — admin-configurable global matching-threshold floor
 * (Prompt §5.2).
 *
 * The global threshold is a persisted, super-admin-configurable FLOOR that no
 * candidate-level preference can fall below. Stored in the `app_settings`
 * collection (Firestore, the app's current persistent store) under doc id
 * `matching_threshold_floor` with field `minimum_matching_percentage`. The
 * Supabase `app_settings` row of the same key is seeded by migration 0008 +
 * upserted to the default (80) by migration 0009 — when the Supabase cutover
 * occurs, this reader swaps to the Supabase client with no call-site change.
 *
 * Rules (Prompt §5.2):
 *   - Default global threshold: 80 (DEFAULT_MATCHING_THRESHOLD).
 *   - Minimum permitted: 75 (MIN_THRESHOLD) — admin can never lower below 75.
 *   - Maximum: 100 (MAX_THRESHOLD) — admin may raise to 80+ up to 100.
 *   - Candidate-level thresholds are clamped UP to the global floor at
 *     resolution time (resolveMatchingThreshold) — they cannot bypass it.
 *
 * The reader is cached (CACHE_TTL_MS) so a drain that scores many candidates
 * does not re-read the setting per candidate. The cache is invalidated on write.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import {
  MIN_THRESHOLD,
  MAX_THRESHOLD,
  DEFAULT_MATCHING_THRESHOLD,
} from './preferences';

export const GLOBAL_THRESHOLD_SETTING_KEY = 'matching_threshold_floor';
const CACHE_TTL_MS = 60_000;

let cached: { value: number; at: number } | null = null;

/** Clamp a candidate global-threshold value to the supported range [75, 100]. */
export function clampGlobalThreshold(value: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : DEFAULT_MATCHING_THRESHOLD;
  return Math.min(Math.max(n, MIN_THRESHOLD), MAX_THRESHOLD);
}

/**
 * Read the persisted global matching-threshold floor. Defaults to
 * DEFAULT_MATCHING_THRESHOLD (80) when unset or unreadable; clamped to
 * [75, 100]. Never throws — matching must still run on a read failure.
 */
export async function getGlobalMatchingThreshold(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }
  let v = DEFAULT_MATCHING_THRESHOLD;
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db.collection('app_settings').doc(GLOBAL_THRESHOLD_SETTING_KEY).get();
      if (snap.exists) {
        const data = snap.data() as { minimum_matching_percentage?: unknown } | undefined;
        const raw = data?.minimum_matching_percentage;
        if (typeof raw === 'number' && Number.isFinite(raw)) v = raw;
      }
    }
  } catch {
    // fall back to default — never throw (matching must still run)
  }
  v = clampGlobalThreshold(v);
  cached = { value: v, at: Date.now() };
  return v;
}

/** Invalidate the in-memory cache (call after an admin updates the setting). */
export function invalidateGlobalMatchingThresholdCache(): void {
  cached = null;
}

/**
 * Persist the global threshold floor. Clamps to [75, 100]. Caller MUST enforce
 * super_admin authorization (the route layer does — mirrors the Supabase RLS
 * `settings_write_super` policy). Returns the clamped persisted value.
 */
export async function setGlobalMatchingThreshold(value: number): Promise<number> {
  const v = clampGlobalThreshold(value);
  const db = getAdminDb();
  if (!db) {
    throw new Error('Service unavailable — database not configured.');
  }
  await db.collection('app_settings').doc(GLOBAL_THRESHOLD_SETTING_KEY).set({
    minimum_matching_percentage: v,
    updatedAt: new Date().toISOString(),
  });
  cached = { value: v, at: Date.now() };
  return v;
}
