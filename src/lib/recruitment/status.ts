/**
 * status.ts — recruitment status architecture (Phase 6).
 *
 * TWO independent status systems on the same application record:
 *
 * A. Internal pipeline stage (`internalStage`) — the full recruiter workflow.
 *    NEVER exposed to candidates. Drives the admin ATS view + internal routing.
 *
 * B. Candidate-visible status (`candidateStatus`) — a controlled, approved
 *    projection. This is the ONLY status the candidate API/frontend/email may
 *    use. It is set INDEPENDENTLY by an authorized admin action (not derived
 *    automatically from every internal transition) so internal churn (holds,
 *    screening queues, approval chains) never leaks to the candidate.
 *
 * The two are linked to the same application record + recruitment workflow but
 * are separate fields. `candidateStatusFromInternal` is a SUGGESTED mapping used
 * only when an admin action moves the internal stage AND chooses to publish the
 * corresponding candidate status — it is never called automatically on every
 * internal transition (the admin route decides per-action whether to publish).
 */
export type CandidateStatus =
  | 'submitted' // Application submitted (initial)
  | 'under_review' // Under review
  | 'shortlisted' // Shortlisted
  | 'assessment_requested' // Assessment requested
  | 'interview_scheduled' // Interview scheduled
  | 'interview_in_progress' // Interview in progress
  | 'decision_pending' // Decision pending
  | 'rejected' // Rejected
  | 'offer_extended' // Offer extended
  | 'hired' // Hired
  | 'withdrawn'; // Withdrawn (by candidate)

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  'submitted', 'under_review', 'shortlisted', 'assessment_requested',
  'interview_scheduled', 'interview_in_progress', 'decision_pending',
  'rejected', 'offer_extended', 'hired', 'withdrawn',
];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  submitted: 'Application submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  assessment_requested: 'Assessment requested',
  interview_scheduled: 'Interview scheduled',
  interview_in_progress: 'Interview in progress',
  decision_pending: 'Decision pending',
  rejected: 'Rejected',
  offer_extended: 'Offer extended',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

/** Candidate-visible color for status badges (Tailwind classes). */
export const CANDIDATE_STATUS_BADGE: Record<CandidateStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  shortlisted: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  assessment_requested: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  interview_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  interview_in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  decision_pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  offer_extended: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  hired: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  withdrawn: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

export type InternalStage =
  | 'new' // New application
  | 'initial_screening' // Initial screening queue
  | 'recruiter_screening' // Recruiter screening
  | 'hiring_manager_review' // Hiring manager review
  | 'team_feedback' // Team feedback pending
  | 'assessment_review' // Assessment review
  | 'interview' // Interview stage
  | 'interview_feedback' // Interview feedback collection
  | 'internal_hold' // Internal hold (NEVER exposed to candidate)
  | 'approval_pending' // Approval pending
  | 'rejection_approval' // Rejection approval pending
  | 'offer_approval' // Offer approval
  | 'offer_extended' // Offer extended
  | 'hired' // Hired
  | 'rejected' // Rejected
  | 'withdrawn' // Withdrawn
  | 'archived'; // Archived

export const INTERNAL_STAGES: InternalStage[] = [
  'new', 'initial_screening', 'recruiter_screening', 'hiring_manager_review',
  'team_feedback', 'assessment_review', 'interview', 'interview_feedback',
  'internal_hold', 'approval_pending', 'rejection_approval', 'offer_approval',
  'offer_extended', 'hired', 'rejected', 'withdrawn', 'archived',
];

export const INTERNAL_STAGE_LABELS: Record<InternalStage, string> = {
  new: 'New application',
  initial_screening: 'Initial screening queue',
  recruiter_screening: 'Recruiter screening',
  hiring_manager_review: 'Hiring manager review',
  team_feedback: 'Team feedback pending',
  assessment_review: 'Assessment review',
  interview: 'Interview stage',
  interview_feedback: 'Interview feedback collection',
  internal_hold: 'Internal hold',
  approval_pending: 'Approval pending',
  rejection_approval: 'Rejection approval pending',
  offer_approval: 'Offer approval',
  offer_extended: 'Offer extended',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
};

/**
 * Suggested candidate-visible status for a given internal stage. Used ONLY when
 * an admin action explicitly chooses to publish (the admin route controls this
 * per-action; not every internal transition publishes a candidate status).
 *
 * Internal-only stages (initial_screening, recruiter_screening, hiring_manager_review,
 * team_feedback, interview_feedback, internal_hold, approval_pending, rejection_approval,
 * offer_approval) map to a conservative `under_review` / `decision_pending` — the
 * candidate sees meaningful progression, never internal administrative detail.
 */
export function candidateStatusFromInternal(stage: InternalStage): CandidateStatus {
  switch (stage) {
    case 'new':
      return 'submitted';
    case 'initial_screening':
    case 'recruiter_screening':
    case 'hiring_manager_review':
    case 'team_feedback':
    case 'assessment_review':
      return 'under_review';
    case 'interview':
    case 'interview_feedback':
      return 'interview_in_progress';
    case 'internal_hold':
    case 'approval_pending':
    case 'rejection_approval':
    case 'offer_approval':
      return 'decision_pending';
    case 'offer_extended':
      return 'offer_extended';
    case 'hired':
      return 'hired';
    case 'rejected':
      return 'rejected';
    case 'withdrawn':
      return 'withdrawn';
    case 'archived':
      // Archived is internal-only; the candidate status is whatever it was
      // before archiving (rejected/withdrawn/hired). Caller preserves the
      // existing candidateStatus; this default is conservative.
      return 'decision_pending';
    default:
      return 'under_review';
  }
}

/**
 * Notification policy: which candidate-visible status transitions trigger an
 * email to the candidate. `under_review` is intentionally NOT emailed by
 * default (configurable — avoids excessive emails for internal churn).
 */
export const EMAIL_TRIGGERING_STATUSES: CandidateStatus[] = [
  'shortlisted',
  'assessment_requested',
  'interview_scheduled',
  'rejected',
  'offer_extended',
  'hired',
  'withdrawn',
];

/** Whether a candidate-visible status transition should send an email. */
export function shouldEmailForCandidateStatus(status: CandidateStatus): boolean {
  return EMAIL_TRIGGERING_STATUSES.includes(status);
}

/** Validate a candidate status string. */
export function isValidCandidateStatus(s: unknown): s is CandidateStatus {
  return typeof s === 'string' && (CANDIDATE_STATUSES as string[]).includes(s);
}

/** Validate an internal stage string. */
export function isValidInternalStage(s: unknown): s is InternalStage {
  return typeof s === 'string' && (INTERNAL_STAGES as string[]).includes(s);
}
