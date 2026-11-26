/**
 * GET/PUT /api/candidate/profile — candidate profile (Prompt 05Q §7).
 *
 * Ownership: the profile doc id is the authenticated candidate's email (from the
 * session). A candidate can ONLY read/write their own profile — verified
 * server-side via verifySession(tier:'user'). No candidate can read another
 * candidate's profile (the route ignores any client-supplied email; the doc id
 * is always the session email).
 *
 * The profile lives in `candidates/{email}` (separate from the auth account in
 * `users/{email}`). The email field is server-set (never client-updatable).
 *
 * Completeness is computed honestly (§7) — never represent an incomplete
 * profile as complete.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth/sessions';
import {
  candidateProfileSchema,
  profileCompleteness,
  type CandidateProfile,
} from '@/lib/auth/candidate-profile';
import { jsonError } from '@/lib/auth/route-helpers';
import { writeAuditLog, sanitizeChangeSummary, newCorrelationId } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const snap = await db.collection('candidates').doc(email).get();
  if (!snap.exists) {
    // No profile yet — return an empty shell + 0% completeness (honest).
    return NextResponse.json({
      profile: { email, fullName: '' },
      completeness: 0,
      hasProfile: false,
    });
  }
  const profile = snap.data() as CandidateProfile;
  return NextResponse.json({
    profile,
    completeness: profileCompleteness(profile),
    hasProfile: true,
  });
}

export async function PUT(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  const parsed = candidateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const now = Timestamp.fromMillis(Date.now());
  const ref = db.collection('candidates').doc(email);

  // Preserve immutable/resume fields (email, resume refs, createdAt) — only
  // update the editable profile fields + updatedAt.
  const existing = await ref.get();
  const createdAt = existing.exists ? (existing.data() as { createdAt?: Timestamp }).createdAt : now;
  const beforeData = existing.exists ? (existing.data() as Record<string, unknown>) : null;

  const correlationId = newCorrelationId();
  try {
    await ref.set(
      {
        ...data,
        email, // server-set (never client-updatable)
        createdAt,
        updatedAt: now,
      },
      { merge: true },
    );
  } catch (err) {
    // Persist a failure audit (server-generated actor) so a failed profile save
    // is traceable, then surface a classified 500. The actor is taken from the
    // verified session — never from the request body.
    await writeAuditLog({
      actor: { id: email, role: 'candidate', tier: 'user' },
      eventType: 'candidate_profile_update',
      entityType: 'candidate',
      entityId: email,
      outcome: 'failure',
      correlationId,
      metadata: { reason: 'profile_write_failed' },
    });
    console.error('[candidate/profile] save failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not save profile. Please try again.');
  }

  // Server-generated audit record with a SAFE before/after summary (secret /
  // path / nested fields are redacted to their names only — see sanitizeChangeSummary).
  // Compute the REAL after-state — the merged result of the write above — so the
  // diff only flags fields that actually changed. Comparing the stored doc against
  // the zod-parsed INPUT would mark every server-only field (email, createdAt,
  // resume refs) as "changed" and sample their before-values, leaking e.g.
  // resumeFileName (the candidate's real name) on every save.
  const afterData: Record<string, unknown> = {
    ...(beforeData ?? {}),
    ...(data as Record<string, unknown>),
    email,
    createdAt,
    updatedAt: now,
  };
  await writeAuditLog({
    actor: { id: email, role: 'candidate', tier: 'user' },
    eventType: 'candidate_profile_update',
    entityType: 'candidate',
    entityId: email,
    outcome: 'success',
    changeSummary: sanitizeChangeSummary(beforeData, afterData),
    correlationId,
  });

  const profile = (await ref.get()).data() as CandidateProfile;
  return NextResponse.json({
    message: 'Profile saved.',
    profile,
    completeness: profileCompleteness(profile),
  });
}
