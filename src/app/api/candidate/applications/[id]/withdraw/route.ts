/**
 * POST /api/candidate/applications/[id]/withdraw — candidate-initiated withdrawal
 * (Phase 5).
 *
 * Ownership enforced: candidateEmail MUST match the session. A candidate can
 * withdraw only their OWN application, and only if it is not already in a
 * terminal state (hired/rejected/withdrawn). The withdrawal sets
 * candidateStatus='withdrawn' + internalStage='withdrawn' + appends a
 * candidate-visible timeline entry + sends a withdrawal-confirmation email
 * (Phase 9). The candidate cannot change any OTHER status — only withdraw.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';
import { sendCandidateStatusEmail } from '@/lib/recruitment/notifications';
import type { CandidateStatus } from '@/lib/recruitment/status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TERMINAL: CandidateStatus[] = ['hired', 'rejected', 'withdrawn'];

export async function POST(
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
    // Look up by the public applicationId reference (consistent with the detail
    // route — the candidate only sees the 'APP_xxxx' reference).
    const q = await db.collection('jobApplications').where('applicationId', '==', id).limit(1).get();
    if (q.empty) return jsonError(404, 'Application not found.');
    const snap = q.docs[0];
    const ref = snap.ref;
    const data = snap.data() as {
      candidateEmail?: string; candidateStatus?: string; deletedAt?: unknown;
      statusTimeline?: unknown[]; candidateName?: string; jobTitle?: string;
      applicationId?: string;
    };
    if (data.candidateEmail !== email) {
      return jsonError(403, 'You do not have access to this application.');
    }
    if (data.deletedAt != null) return jsonError(404, 'Application not found.');

    if (TERMINAL.includes(data.candidateStatus as CandidateStatus)) {
      return jsonError(409, 'This application is already closed and cannot be withdrawn.');
    }

    const now = new Date();
    const timeline = Array.isArray(data.statusTimeline) ? data.statusTimeline : [];
    await ref.update({
      candidateStatus: 'withdrawn',
      internalStage: 'withdrawn',
      status: 'Withdrawn',
      withdrawnAt: now,
      updatedAt: now,
      statusTimeline: [...timeline, { status: 'withdrawn', label: 'Application withdrawn by candidate', at: now }],
    });

    // Withdrawal confirmation email (Phase 9). Best-effort — a failed email does
    // NOT revert the withdrawal (the DB is the source of truth).
    await sendCandidateStatusEmail({
      to: email,
      candidateName: data.candidateName || email,
      jobTitle: data.jobTitle || '',
      applicationId: data.applicationId || id,
      status: 'withdrawn',
    }).catch(() => {});

    return NextResponse.json({ ok: true, message: 'Application withdrawn.' });
  } catch {
    return jsonError(500, 'Could not withdraw application.');
  }
}
