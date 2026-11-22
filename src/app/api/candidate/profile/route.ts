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

  await ref.set(
    {
      ...data,
      email, // server-set (never client-updatable)
      createdAt,
      updatedAt: now,
    },
    { merge: true },
  );

  const profile = (await ref.get()).data() as CandidateProfile;
  return NextResponse.json({
    message: 'Profile saved.',
    profile,
    completeness: profileCompleteness(profile),
  });
}
