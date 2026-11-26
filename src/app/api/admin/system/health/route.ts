/**
 * GET /api/admin/system/health — real system health for the Admin dashboard.
 *
 * Replaces the previously HARDCODED "System Health" card on /admin ("Firestore
 * Persistence: Online" + "AI Matching Engine: Ready 95%" were literal strings
 * with no underlying check), AND replaces the env-presence-only version that
 * followed it (which reported "Online" whenever a credential was parseable, even
 * if the service was down — misleading).
 *
 * Each backend data dependency is now a real liveness probe with a short timeout:
 *   - firestore    : isAdminConfigured() ? bounded read on adminActivityLogs
 *                    (≤1 doc, ≤1 read billed) -> 'online' | 'degraded' | 'unconfigured'
 *   - resumeStorage: Supabase server client ? list 1 object in candidate-resumes
 *                    -> 'online' | 'degraded' | 'unconfigured'
 *   - ai           : hasGeminiKey() -> 'online' | 'unconfigured'. Deliberately NOT
 *                    live-probed (calling the Gemini API on every dashboard load
 *                    would add latency + rate-limit/cost coupling); a missing key
 *                    is the only actionable misconfiguration surfaced here.
 *
 * A probe that times out or throws is 'degraded' (never a 500) — the card shows
 * amber "Degraded", not a green "Online" for a service that is down. Any active
 * admin (verifyAdmin) may read it. Values are status strings only — never keys,
 * URLs, or credentials.
 */
import { NextResponse } from 'next/server';
import { isAdminConfigured, getAdminDb } from '@/lib/firebase-admin';
import { RESUME_BUCKET } from '@/lib/resume-storage';
import { getSupabaseServer } from '@/lib/supabase/server';
import { hasGeminiKey } from '@/ai/models';
import { verifyAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type HealthStatus = 'online' | 'degraded' | 'unconfigured';

const PROBE_TIMEOUT_MS = 2_000;

/**
 * Race an async probe against a timeout. Resolves true on success, false on
 * timeout or throw — never rejects, so one slow/unreachable dependency cannot
 * turn the health endpoint into a 500 or stall the dashboard card.
 */
async function probe(label: string, fn: () => Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[health] ${label} probe timed out after ${PROBE_TIMEOUT_MS}ms`);
      resolve(false);
    }, PROBE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      fn().then(
        () => true as const,
        (err: unknown) => {
          console.warn(`[health] ${label} probe failed:`, err instanceof Error ? err.message : err);
          return false as const;
        },
      ),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function firestoreStatus(): Promise<HealthStatus> {
  if (!isAdminConfigured()) return 'unconfigured';
  const db = getAdminDb();
  if (!db) return 'unconfigured';
  // Cheap liveness probe: a bounded read on a real collection (≤1 doc, ≤1 read).
  // An unreachable/transient Firestore surfaces as 'degraded', not a 500.
  const ok = await probe('firestore', () => db.collection('adminActivityLogs').limit(1).get());
  return ok ? 'online' : 'degraded';
}

async function resumeStorageStatus(): Promise<HealthStatus> {
  const sb = getSupabaseServer();
  if (!sb) return 'unconfigured';
  // Cheap liveness probe: list at most one object in the resume bucket. A Supabase
  // error (bucket missing / unreachable / bad key) surfaces as 'degraded'.
  const ok = await probe('resumeStorage', async () => {
    const { error } = await sb.storage.from(RESUME_BUCKET).list('', { limit: 1 });
    if (error) throw new Error(String(error.message || 'supabase storage list error'));
  });
  return ok ? 'online' : 'degraded';
}

function aiStatus(): HealthStatus {
  // Key presence only — see module header for why the Gemini API is not probed.
  return hasGeminiKey() ? 'online' : 'unconfigured';
}

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const [firestore, resumeStorage] = await Promise.all([
    firestoreStatus(),
    resumeStorageStatus(),
  ]);
  const ai = aiStatus();

  return NextResponse.json({
    health: { firestore, resumeStorage, ai },
    // ISO timestamp so the UI can show "checked Ns ago" honestly.
    checkedAt: new Date().toISOString(),
  });
}
