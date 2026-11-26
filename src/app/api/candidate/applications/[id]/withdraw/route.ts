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
import { writeAuditLog, newCorrelationId } from '@/lib/audit-log';

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
    // Existence + ownership are indistinguishable to the caller (same 404) so a
    // candidate probing an arbitrary applicationId cannot enumerate which IDs
    // exist-vs-belong-to-someone-else. The APP_ keyspace (36^9) makes brute force
    // infeasible regardless, but we avoid the signal.
    if (q.empty) return jsonError(404, 'Application not found.');
    const snap = q.docs[0];
    const ref = snap.ref;
    const data = snap.data() as {
      candidateEmail?: string; candidateStatus?: string; deletedAt?: unknown;
      statusTimeline?: unknown[]; candidateName?: string; jobTitle?: string;
      applicationId?: string;
    };
    if (data.candidateEmail !== email || data.deletedAt != null) {
      return jsonError(404, 'Application not found.');
    }

    const correlationId = newCorrelationId();
    const entityId = data.applicationId || id;

    // Atomic terminal-check + status write. Previously this was a non-conditional
    // read-then-update: if an admin set candidateStatus='hired' (a terminal
    // status) between the candidate's read and write, the candidate's
    // unconditional update silently reverted the hire to 'withdrawn'. Wrapping the
    // re-read + the write in one transaction makes the check-and-write atomic
    // (Firestore re-reads + retries the transaction on conflict). The success
    // audit fires ONLY if the status actually transitioned, so two concurrent
    // withdraws do not double-log a success for one logical withdrawal.
    let alreadyTerminal = false;
    try {
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(ref);
        if (!fresh.exists) {
          alreadyTerminal = true; // doc vanished mid-flight — not withdrawable
          return;
        }
        const fd = fresh.data() as { candidateStatus?: string; statusTimeline?: unknown[]; deletedAt?: unknown };
        if (fd.deletedAt != null || TERMINAL.includes(fd.candidateStatus as CandidateStatus)) {
          alreadyTerminal = true;
          return; // do not write — signal 409 after the transaction commits
        }
        const now = new Date();
        const timeline = Array.isArray(fd.statusTimeline) ? fd.statusTimeline : [];
        tx.update(ref, {
          candidateStatus: 'withdrawn',
          internalStage: 'withdrawn',
          status: 'Withdrawn',
          withdrawnAt: now,
          updatedAt: now,
          statusTimeline: [...timeline, { status: 'withdrawn', label: 'Application withdrawn by candidate', at: now }],
        });
      });
    } catch (err) {
      await writeAuditLog({
        actor: { id: email, role: 'candidate', tier: 'user' },
        eventType: 'candidate_application_withdraw',
        entityType: 'jobApplication',
        entityId,
        outcome: 'failure',
        correlationId,
        metadata: { reason: 'withdraw_update_failed' },
      });
      console.error('[candidate/withdraw] update failed:', err instanceof Error ? err.message : err);
      return jsonError(500, 'Could not withdraw application.');
    }

    if (alreadyTerminal) {
      // The application was closed (by an admin or a concurrent withdraw) between
      // the initial read and the atomic write. No state changed, no success audit.
      return jsonError(409, 'This application is already closed and cannot be withdrawn.');
    }

    // Withdrawal confirmation email (Phase 9). Best-effort — a failed email does
    // NOT revert the withdrawal (the DB is the source of truth).
    await sendCandidateStatusEmail({
      to: email,
      candidateName: data.candidateName || email,
      jobTitle: data.jobTitle || '',
      applicationId: entityId,
      status: 'withdrawn',
    }).catch(() => {});

    // Server-generated audit so candidate-initiated withdrawals appear in the
    // admin Activity feed (previously only the timeline entry on the doc recorded this).
    await writeAuditLog({
      actor: { id: email, role: 'candidate', tier: 'user' },
      eventType: 'candidate_application_withdraw',
      entityType: 'jobApplication',
      entityId,
      outcome: 'success',
      correlationId,
    });

    return NextResponse.json({ ok: true, message: 'Application withdrawn.' });
  } catch {
    return jsonError(500, 'Could not withdraw application.');
  }
}
