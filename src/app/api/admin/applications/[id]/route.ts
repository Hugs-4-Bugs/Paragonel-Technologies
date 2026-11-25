/**
 * GET  /api/admin/applications/[id] — single application (ATS detail, full doc).
 * PATCH /api/admin/applications/[id] — recruitment management (Phase 7).
 *
 * PATCH body (validated):
 *   { internalStage?, candidateStatus?, internalNotes?, addNote?, decision?,
 *     deletedAt?, publishCandidateStatus? }
 *
 *   - internalStage: change the INTERNAL pipeline stage (never exposed to candidates).
 *   - candidateStatus: change the CANDIDATE-VISIBLE status (independent of
 *     internalStage). Appends a timeline entry + sends an email per the policy.
 *   - internalNotes: replace the internal notes string (private).
 *   - addNote: append a structured private note (screening/interview/general)
 *     with author + timestamp. NEVER exposed to candidates.
 *   - decision: shortcut that sets both internalStage + candidateStatus atomically:
 *     'shortlist' | 'reject' | 'offer' | 'hire' | 'assess' | 'archive'.
 *   - deletedAt: 'soft' | 'restore' (archive/restore).
 *   - publishCandidateStatus: default true — whether to append the candidateStatus
 *     change to the candidate-visible timeline + email. Set false for an
 *     internal-only candidate-status adjustment.
 *
 * Every change writes an audit log (logActivityServer) + persists the actor +
 * timestamp. Internal notes/stages NEVER reach the candidate API (the candidate
 * serializer is an explicit allowlist).
 *
 * Auth: GET = verifyAdmin (any active admin). PATCH = verifyAdminPermission
 * ('cms.update') so a read-only viewer cannot mutate.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  verifyAdmin,
  verifyAdminPermission,
  logActivityServer,
  serializeDoc,
  serviceUnavailable,
} from '@/lib/admin-auth';
import {
  type InternalStage,
  type CandidateStatus,
  INTERNAL_STAGES,
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  INTERNAL_STAGE_LABELS,
  isValidInternalStage,
  isValidCandidateStatus,
} from '@/lib/recruitment/status';
import { sendCandidateStatusEmail } from '@/lib/recruitment/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Shortcut decision → (internalStage, candidateStatus). */
const DECISION_MAP: Record<string, { internal: InternalStage; candidate: CandidateStatus | null }> = {
  shortlist: { internal: 'recruiter_screening', candidate: 'shortlisted' },
  reject: { internal: 'rejected', candidate: 'rejected' },
  offer: { internal: 'offer_extended', candidate: 'offer_extended' },
  hire: { internal: 'hired', candidate: 'hired' },
  assess: { internal: 'assessment_review', candidate: 'assessment_requested' },
  archive: { internal: 'archived', candidate: null }, // archived is internal-only
};

const patchSchema = z.object({
  internalStage: z.string().refine(isValidInternalStage, 'Invalid internal stage').optional(),
  candidateStatus: z.string().refine(isValidCandidateStatus, 'Invalid candidate status').optional(),
  internalNotes: z.string().trim().max(10000).optional(),
  addNote: z
    .object({
      body: z.string().trim().min(1, 'Note body is required').max(5000),
      kind: z.enum(['screening', 'interview', 'general']).optional(),
    })
    .optional(),
  decision: z.enum(['shortlist', 'reject', 'offer', 'hire', 'assess', 'archive']).optional(),
  deletedAt: z.enum(['soft', 'restore']).optional(),
  publishCandidateStatus: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    const snap = await db.collection('jobApplications').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/applications/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load application' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  const actor = auth.user.email;
  const actorRole = auth.user.role;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Read the current doc for prev values + the timeline (atomic read-then-write;
  // admin actions are not high-throughput, + the timeline append needs the prev array).
  const ref = db.collection('jobApplications').doc(id);
  let snap;
  try {
    snap = await ref.get();
  } catch (err) {
    console.error('[admin/applications/[id]] read failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to read application' }, { status: 500 });
  }
  if (!snap.exists) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  const prev = snap.data() as {
    internalStage?: string;
    candidateStatus?: string;
    status?: string;
    statusTimeline?: unknown[];
    internalNotes?: string;
    notes?: unknown[];
    candidateEmail?: string;
    candidateName?: string;
    jobTitle?: string;
    applicationId?: string;
  };

  const update: Record<string, unknown> = {};
  const audit: string[] = [];
  const now = new Date();
  const timeline = Array.isArray(prev.statusTimeline) ? prev.statusTimeline : [];
  let newCandidateStatus: CandidateStatus | null = null;
  let emailToSend: { status: CandidateStatus } | null = null;

  // Decision shortcut → set both fields.
  if (data.decision) {
    const mapping = DECISION_MAP[data.decision];
    const prevInternal = prev.internalStage ?? 'new';
    update.internalStage = mapping.internal;
    audit.push(`Internal stage: ${INTERNAL_STAGE_LABELS[prevInternal as InternalStage] ?? prevInternal} → ${INTERNAL_STAGE_LABELS[mapping.internal]}`);
    if (mapping.candidate) {
      newCandidateStatus = mapping.candidate;
      update.candidateStatus = mapping.candidate;
      // Sync the legacy status field for backward compat (admin ATS list).
      update.status = mapping.candidate === 'rejected' ? 'Rejected'
        : mapping.candidate === 'hired' ? 'Hired'
        : mapping.candidate === 'offer_extended' ? 'Offer Extended'
        : mapping.candidate === 'shortlisted' ? 'Shortlisted'
        : 'Reviewing';
    }
  }

  // Explicit internalStage change.
  if (data.internalStage && !data.decision) {
    const prevInternal = prev.internalStage ?? 'new';
    update.internalStage = data.internalStage;
    audit.push(`Internal stage: ${INTERNAL_STAGE_LABELS[prevInternal as InternalStage] ?? prevInternal} → ${INTERNAL_STAGE_LABELS[data.internalStage as InternalStage]}`);
  }

  // Explicit candidateStatus change (independent of internalStage).
  const candidateStatusToSet = data.candidateStatus ?? newCandidateStatus;
  if (candidateStatusToSet) {
    const prevCandidate = (prev.candidateStatus as CandidateStatus) ?? 'submitted';
    update.candidateStatus = candidateStatusToSet;
    if (!data.decision) {
      // Sync legacy status for non-decision explicit candidate-status changes.
      update.status = candidateStatusToSet === 'rejected' ? 'Rejected'
        : candidateStatusToSet === 'hired' ? 'Hired'
        : candidateStatusToSet === 'offer_extended' ? 'Offer Extended'
        : candidateStatusToSet === 'shortlisted' ? 'Shortlisted'
        : candidateStatusToSet === 'withdrawn' ? 'Withdrawn'
        : 'Reviewing';
    }
    audit.push(`Candidate status: ${CANDIDATE_STATUS_LABELS[prevCandidate]} → ${CANDIDATE_STATUS_LABELS[candidateStatusToSet]}`);

    // Publish to the candidate-visible timeline + email (unless suppressed).
    const publish = data.publishCandidateStatus !== false;
    if (publish && candidateStatusToSet !== prevCandidate) {
      update.statusTimeline = [
        ...timeline,
        { status: candidateStatusToSet, label: CANDIDATE_STATUS_LABELS[candidateStatusToSet], at: now, actor },
      ];
      emailToSend = { status: candidateStatusToSet };
    }
  }

  // Internal notes (replace).
  if (typeof data.internalNotes === 'string') {
    update.internalNotes = data.internalNotes;
    audit.push('Updated internal notes');
  }

  // Append a structured private note.
  if (data.addNote) {
    const notes = Array.isArray(prev.notes) ? prev.notes : [];
    update.notes = [
      ...notes,
      {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        body: data.addNote.body,
        kind: data.addNote.kind ?? 'general',
        author: actor,
        authorRole: actorRole,
        at: now,
      },
    ];
    audit.push(`Added ${data.addNote.kind ?? 'general'} note`);
  }

  // Soft-delete / restore (archive).
  if (data.deletedAt === 'soft') {
    update.deletedAt = Timestamp.now();
    audit.push('Archived application');
  } else if (data.deletedAt === 'restore') {
    update.deletedAt = null;
    audit.push('Restored application');
  }

  update.updatedAt = Timestamp.now();
  update.lastActor = actor;
  update.lastActorRole = actorRole;

  if (Object.keys(update).length <= 2) {
    // Only updatedAt + lastActor — no real change.
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    await ref.update(update);
  } catch (err) {
    console.error('[admin/applications/[id]] update failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Audit log (server-side, protected — candidates cannot read activity logs).
  for (const action of audit) {
    await logActivityServer(auth.user, action, 'JobApplication', id);
  }

  // Email (best-effort — never reverts the status change).
  if (emailToSend) {
    await sendCandidateStatusEmail({
      to: prev.candidateEmail || '',
      candidateName: prev.candidateName || '',
      jobTitle: prev.jobTitle || '',
      applicationId: prev.applicationId || id,
      status: emailToSend.status,
    }).catch((err) => {
      console.error('[admin/applications/[id]] email failed:', err instanceof Error ? err.message : err);
    });
  }

  return NextResponse.json({ ok: true, updated: Object.keys(update) });
}
