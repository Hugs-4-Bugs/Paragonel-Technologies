/**
 * GET /api/candidate/applications/[id] — a single application detail (Phase 5).
 *
 * Ownership enforced server-side: the application's candidateEmail MUST match
 * the authenticated session email. Changing the ID in the URL does NOT bypass
 * authorization — a candidate cannot read another candidate's application.
 *
 * Returns the candidate-safe view (toCandidateApplication): the submitted
 * snapshot, candidate-visible status, candidate-visible timeline, and
 * candidate-approved interview fields. Internal notes, internalStage, reviewer
 * identities, scores, and confidential feedback are never included.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';
import { toCandidateApplication } from '@/lib/recruitment/candidate-view';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  const { id } = await params;
  try {
    // Look up by the public applicationId reference (NOT the internal firestore
    // doc id) — the candidate only ever sees the 'APP_xxxx' reference. The
    // firestore doc id is an internal implementation detail never exposed to
    // candidates (they cannot guess it to access another candidate's application).
    const q = await db.collection('jobApplications').where('applicationId', '==', id).limit(1).get();
    if (q.empty) return jsonError(404, 'Application not found.');
    const snap = q.docs[0];
    const data = snap.data() as { candidateEmail?: string; deletedAt?: unknown };
    // Authorization: the application MUST belong to the authenticated candidate.
    if (data.candidateEmail !== email) {
      return jsonError(403, 'You do not have access to this application.');
    }
    if (data.deletedAt != null) return jsonError(404, 'Application not found.');
    const application = toCandidateApplication(snap.data(), snap.id);
    return NextResponse.json({ application });
  } catch {
    return jsonError(500, 'Could not load application.');
  }
}
