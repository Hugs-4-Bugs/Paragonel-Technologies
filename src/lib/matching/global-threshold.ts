/**
 * global-threshold.ts — admin-configurable global matching-threshold floor,
 * Supabase-backed (Prompt §5.1: "must become Supabase-backed"; no separate
 * conflicting Firestore value).
 *
 * The global threshold is a persisted, super-admin-configurable FLOOR that no
 * candidate-level preference can fall below. Stored in the Supabase `app_settings`
 * table under key `matching_threshold_floor` with value
 * `{"minimum_matching_percentage": <int>}` (seeded by 0008, upserted to the
 * default 80 by 0009). Reads/writes go through the Supabase data-access layer
 * (src/lib/supabase/data/app-settings.ts) — the Firestore app_settings doc is
 * no longer used for the threshold (removed per §5.1 to avoid conflicting values).
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
 * When Supabase is unreachable (not configured), the reader returns the default
 * (80) — matching still runs; the writer returns an honest 503 (the route surfaces it).
 */
import { getSetting, setSetting } from '@/lib/supabase/data/app-settings';
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
 * Read the persisted global matching-threshold floor from Supabase. Defaults to
 * DEFAULT_MATCHING_THRESHOLD (80) when unset, Supabase unreachable, or on any
 * read error; clamped to [75, 100]. Never throws — matching must still run.
 */
export async function getGlobalMatchingThreshold(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }
  let v = DEFAULT_MATCHING_THRESHOLD;
  try {
    const raw = await getSetting(GLOBAL_THRESHOLD_SETTING_KEY);
    if (raw && typeof raw === 'object') {
      const n = (raw as { minimum_matching_percentage?: unknown }).minimum_matching_percentage;
      if (typeof n === 'number' && Number.isFinite(n)) v = n;
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
 * Persist the global threshold floor to Supabase. Clamps to [75, 100]. Caller
 * MUST enforce super_admin authorization (the route layer does — mirrors the
 * Supabase RLS `settings_write_super` policy). Returns the clamped persisted
 * value; throws an honest "Service unavailable" if Supabase is unconfigured or
 * the write failed (the route surfaces this as 503).
 */
export async function setGlobalMatchingThreshold(value: number): Promise<number> {
  const v = clampGlobalThreshold(value);
  const ok = await setSetting(
    GLOBAL_THRESHOLD_SETTING_KEY,
    { minimum_matching_percentage: v },
  );
  if (!ok) {
    throw new Error('Service unavailable — Supabase not configured or write failed.');
  }
  cached = { value: v, at: Date.now() };
  return v;
}
