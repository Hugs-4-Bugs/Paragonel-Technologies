/**
 * POST  /api/admin/applications/[id]/interviews — schedule an interview (Phase 8).
 * PATCH /api/admin/applications/[id]/interviews — reschedule / cancel / add feedback.
 *
 * Interview object stored on the application doc (interviews[]):
 *   { id, stage, date, startTime, timeZone, mode, meetingLink, instructions,
 *     status, candidateVisible, interviewer, internalNotes, feedback, outcome,
 *     createdAt, createdBy, updatedAt, updatedBy }
 *
 * Candidate-visible fields (exposed via toCandidateApplication): stage, date,
 * startTime, timeZone, mode, meetingLink, instructions, status. The internal
 * fields (interviewer, internalNotes, feedback, outcome) are NEVER exposed to
 * candidates.
 *
 * Emails: scheduling + rescheduling + cancellation send a candidate email with
 * the approved details only. Feedback does NOT send an email.
 *
 * Auth: verifyAdminPermission('cms.update').
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { sendInterviewEmail, type InterviewEmailDetails } from '@/lib/recruitment/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const scheduleSchema = z.object({
  stage: z.string().trim().min(1, 'Stage is required').max(100),
  date: z.string().trim().min(1, 'Date is required').max(50),
  startTime: z.string().trim().min(1, 'Start time is required').max(20),
  timeZone: z.string().trim().min(1, 'Time zone is required').max(50),
  mode: z.enum(['video', 'phone', 'onsite']),
  meetingLink: z.string().trim().max(500).optional().or(z.literal('')),
  instructions: z.string().trim().max(2000).optional().or(z.literal('')),
  interviewer: z.string().trim().max(200).optional().or(z.literal('')),
  internalNotes: z.string().trim().max(5000).optional().or(z.literal('')),
  notifyCandidate: z.boolean().optional(),
});

const patchSchema = z.object({
  interviewId: z.string().trim().min(1, 'interviewId is required'),
  action: z.enum(['reschedule', 'cancel', 'feedback']),
  // reschedule:
  date: z.string().trim().max(50).optional(),
  startTime: z.string().trim().max(20).optional(),
  timeZone: z.string().trim().max(50).optional(),
  mode: z.enum(['video', 'phone', 'onsite']).optional(),
  meetingLink: z.string().trim().max(500).optional().or(z.literal('')),
  instructions: z.string().trim().max(2000).optional().or(z.literal('')),
  // feedback (internal — never exposed to candidate, never emailed):
  feedback: z.string().trim().max(5000).optional().or(z.literal('')),
  outcome: z.enum(['positive', 'neutral', 'negative']).optional(),
  notifyCandidate: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  const { id } = await params;
  const actor = auth.user.email;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const ref = db.collection('jobApplications').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  const prev = snap.data() as {
    interviews?: unknown[]; candidateEmail?: string; candidateName?: string;
    jobTitle?: string; applicationId?: string; statusTimeline?: unknown[];
    candidateStatus?: string;
  };

  const now = new Date();
  const interviewId = `iv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const interview = {
    id: interviewId,
    stage: d.stage,
    date: d.date,
    startTime: d.startTime,
    timeZone: d.timeZone,
    mode: d.mode,
    meetingLink: d.meetingLink || '',
    instructions: d.instructions || '',
    status: 'scheduled',
    candidateVisible: true, // visible to the candidate (scheduled interview)
    interviewer: d.interviewer || '',
    internalNotes: d.internalNotes || '',
    feedback: '',
    outcome: '',
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  };

  const interviews = Array.isArray(prev.interviews) ? prev.interviews : [];
  const timeline = Array.isArray(prev.statusTimeline) ? prev.statusTimeline : [];

  await ref.update({
    interviews: [...interviews, interview],
    // Move the candidate to interview_scheduled + internal 'interview' stage.
    candidateStatus: 'interview_scheduled',
    internalStage: 'interview',
    status: 'Interview Scheduled',
    statusTimeline: [
      ...timeline,
      { status: 'interview_scheduled', label: 'Interview scheduled', at: now, actor },
    ],
    updatedAt: Timestamp.now(),
    lastActor: actor,
    lastActorRole: auth.user.role,
  });

  await logActivityServer(auth.user, `Scheduled interview: ${d.stage} on ${d.date} ${d.startTime} ${d.timeZone} (${d.mode})`, 'JobApplication', id);

  // Email the candidate (approved details only).
  if (d.notifyCandidate !== false) {
    await sendInterviewEmail({
      to: prev.candidateEmail || '',
      candidateName: prev.candidateName || '',
      jobTitle: prev.jobTitle || '',
      applicationId: prev.applicationId || id,
      kind: 'scheduled',
      details: {
        stage: d.stage,
        date: d.date,
        startTime: d.startTime,
        timeZone: d.timeZone,
        mode: d.mode,
        meetingLink: d.meetingLink || undefined,
        instructions: d.instructions || undefined,
      } as InterviewEmailDetails,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, interviewId });
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

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const ref = db.collection('jobApplications').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  const prev = snap.data() as {
    interviews?: Array<Record<string, unknown>>;
    candidateEmail?: string; candidateName?: string; jobTitle?: string; applicationId?: string;
    statusTimeline?: unknown[];
  };

  const interviews = Array.isArray(prev.interviews) ? prev.interviews : [];
  const idx = interviews.findIndex((iv) => iv.id === d.interviewId);
  if (idx === -1) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

  const iv = interviews[idx];
  const now = new Date();
  let auditMsg = '';
  let emailKind: 'rescheduled' | 'cancelled' | null = null;

  if (d.action === 'cancel') {
    iv.status = 'cancelled';
    iv.candidateVisible = d.notifyCandidate !== false; // keep visible as cancelled (shows in timeline)
    iv.updatedAt = now;
    iv.updatedBy = actor;
    auditMsg = `Cancelled interview: ${iv.stage}`;
    emailKind = 'cancelled';
  } else if (d.action === 'reschedule') {
    if (d.date) iv.date = d.date;
    if (d.startTime) iv.startTime = d.startTime;
    if (d.timeZone) iv.timeZone = d.timeZone;
    if (d.mode) iv.mode = d.mode;
    if (typeof d.meetingLink === 'string') iv.meetingLink = d.meetingLink;
    if (typeof d.instructions === 'string') iv.instructions = d.instructions;
    iv.status = 'rescheduled';
    iv.updatedAt = now;
    iv.updatedBy = actor;
    auditMsg = `Rescheduled interview: ${iv.stage} → ${iv.date} ${iv.startTime} ${iv.timeZone}`;
    emailKind = 'rescheduled';
  } else if (d.action === 'feedback') {
    // Internal feedback — NEVER exposed to candidate, NEVER emailed.
    if (typeof d.feedback === 'string') iv.feedback = d.feedback;
    if (d.outcome) iv.outcome = d.outcome;
    iv.updatedAt = now;
    iv.updatedBy = actor;
    iv.candidateVisible = false; // feedback entries are internal
    auditMsg = `Added interview feedback: ${iv.stage}`;
  }

  interviews[idx] = iv;
  await ref.update({
    interviews: [...interviews],
    updatedAt: Timestamp.now(),
    lastActor: actor,
    lastActorRole: auth.user.role,
  });

  await logActivityServer(auth.user, auditMsg, 'JobApplication', id);

  if (emailKind && d.notifyCandidate !== false) {
    await sendInterviewEmail({
      to: prev.candidateEmail || '',
      candidateName: prev.candidateName || '',
      jobTitle: prev.jobTitle || '',
      applicationId: prev.applicationId || id,
      kind: emailKind,
      details: {
        stage: String(iv.stage || ''),
        date: String(iv.date || ''),
        startTime: String(iv.startTime || ''),
        timeZone: String(iv.timeZone || ''),
        mode: String(iv.mode || ''),
        meetingLink: iv.meetingLink ? String(iv.meetingLink) : undefined,
        instructions: iv.instructions ? String(iv.instructions) : undefined,
      } as InterviewEmailDetails,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
