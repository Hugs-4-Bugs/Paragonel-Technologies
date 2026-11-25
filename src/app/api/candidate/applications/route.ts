/**
 * GET /api/candidate/applications — the authenticated candidate's applications,
 * candidate-safe serialized (Phase 5/6).
 *
 * Ownership: verifySession(tier:'user') → the candidate's email. The query is
 * scoped to candidateEmail == email (server-set on submission). A candidate can
 * ONLY see their own applications — never another candidate's. Soft-deleted
 * applications are excluded.
 *
 * SECURITY: the response is built from `toCandidateApplication` — an EXPLICIT
 * allowlist of candidate-visible fields. Internal notes, internalStage, reviewer
 * identities, internal scores, and confidential interview feedback are NEVER
 * serialized to the candidate (stripped server-side, not hidden in the frontend).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';
import { toCandidateApplication } from '@/lib/recruitment/candidate-view';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  try {
    const snap = await db.collection('jobApplications').where('candidateEmail', '==', email).get();
    const applications = snap.docs
      .filter((d) => (d.data() as { deletedAt?: unknown }).deletedAt == null)
      .map((d) => toCandidateApplication(d.data(), d.id))
      .sort((a, b) => {
        const ta = a.appliedAt ? Date.parse(a.appliedAt) : 0;
        const tb = b.appliedAt ? Date.parse(b.appliedAt) : 0;
        return tb - ta;
      });
    return NextResponse.json({ applications });
  } catch {
    return jsonError(500, 'Could not load applications.');
  }
}
