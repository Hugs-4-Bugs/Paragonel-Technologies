/**
 * GET / PATCH /api/candidate/profile/preferences — job-alert preference
 * management (Prompt 05R §5, §9).
 *
 * Ownership: identical to /api/candidate/profile — the doc id is the
 * authenticated candidate's email (from verifySession tier 'user'). A candidate
 * can only read/change their OWN preferences; any client-supplied email is
 * ignored. The threshold is validated (75-100 integer) + clamped server-side at
 * decision time; the alert opt-in is opt-in (absent => off).
 *
 * GET returns both the raw stored values and the resolved effective values so
 * the UI can show "your threshold is 80%" even when nothing was explicitly set.
 * PATCH validates with jobAlertPreferencesSchema and merges into the profile.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';
import { writeAuditLog, sanitizeChangeSummary, newCorrelationId } from '@/lib/audit-log';
import {
  jobAlertPreferencesSchema,
  resolveMatchingThreshold,
  resolveJobAlertPreference,
  DEFAULT_MATCHING_THRESHOLD,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
} from '@/lib/matching/preferences';
import { getGlobalMatchingThreshold } from '@/lib/matching/global-threshold';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('candidates').doc(email).get();
  const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
  const rawThreshold = typeof data.matchingThreshold === 'number' ? data.matchingThreshold : undefined;
  return NextResponse.json({
    email,
    raw: {
      jobAlertPreference: data.jobAlertPreference === true,
      matchingThreshold: rawThreshold,
      preferredRoles: data.preferredRoles || [],
      preferredLocations: data.preferredLocations || [],
      preferredEmploymentType: data.preferredEmploymentType || null,
      workModePreference: data.workModePreference || null,
    },
    effective: {
      jobAlertPreference: resolveJobAlertPreference(data.jobAlertPreference),
      matchingThreshold: resolveMatchingThreshold(data.matchingThreshold, await getGlobalMatchingThreshold()),
    },
    defaults: { matchingThreshold: DEFAULT_MATCHING_THRESHOLD, min: MIN_THRESHOLD, max: MAX_THRESHOLD },
    note: 'Job alerts are based on profile matching and are separate from marketing emails.',
  });
}

export async function PATCH(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  const parsed = jobAlertPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const ref = db.collection('candidates').doc(email);
  // Capture the pre-change state for a SAFE audit summary (secret/path fields
  // redacted to names only — see sanitizeChangeSummary).
  const beforeSnap = await ref.get();
  const beforeData = beforeSnap.exists ? (beforeSnap.data() as Record<string, unknown>) : null;

  // Only update the preference fields — never touch identity/resume/consent.
  const patch: Record<string, unknown> = {
    jobAlertPreference: parsed.data.jobAlertPreference,
    matchingThreshold: parsed.data.matchingThreshold,
    updatedAt: Timestamp.fromMillis(Date.now()),
  };
  if (parsed.data.preferredRoles !== undefined) patch.preferredRoles = parsed.data.preferredRoles;
  if (parsed.data.preferredLocations !== undefined) patch.preferredLocations = parsed.data.preferredLocations;
  if (parsed.data.preferredEmploymentType !== undefined) patch.preferredEmploymentType = parsed.data.preferredEmploymentType;
  if (parsed.data.workModePreference !== undefined) patch.workModePreference = parsed.data.workModePreference;

  const correlationId = newCorrelationId();
  // Ensure the profile doc exists (merge creates it if missing, preserving email).
  try {
    await ref.set({ ...patch, email }, { merge: true });
  } catch (err) {
    await writeAuditLog({
      actor: { id: email, role: 'candidate', tier: 'user' },
      eventType: 'candidate_preferences_update',
      entityType: 'candidate',
      entityId: email,
      outcome: 'failure',
      correlationId,
      metadata: { reason: 'preferences_write_failed' },
    });
    console.error('[candidate/preferences] save failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not save preferences.');
  }

  // Server-generated audit record (actor from the verified session).
  await writeAuditLog({
    actor: { id: email, role: 'candidate', tier: 'user' },
    eventType: 'candidate_preferences_update',
    entityType: 'candidate',
    entityId: email,
    outcome: 'success',
    changeSummary: sanitizeChangeSummary(beforeData, { ...beforeData, ...patch }),
    correlationId,
  });

  const snap = await ref.get();
  const data = (snap.data() || {}) as Record<string, unknown>;
  return NextResponse.json({
    message: 'Preferences saved.',
    effective: {
      jobAlertPreference: resolveJobAlertPreference(data.jobAlertPreference),
      matchingThreshold: resolveMatchingThreshold(data.matchingThreshold, await getGlobalMatchingThreshold()),
    },
  });
}
