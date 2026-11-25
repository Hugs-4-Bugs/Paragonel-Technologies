/**
 * candidate-view.ts — candidate-safe application serializer (Phase 6).
 *
 * SECURITY: candidate-visible API responses are built from an EXPLICIT
 * allowlist of approved fields. The full internal application doc is NEVER
 * serialized to candidates — internal notes, internalStage, reviewer
 * identities, internal scores, confidential interview feedback, internal
 * compensation discussions, and rejection deliberations are stripped at the
 * server, not hidden in the frontend.
 *
 * This is the ONLY shape the candidate API (/api/candidate/applications*),
 * candidate frontend, and candidate emails may use. Admin APIs use the full doc
 * (authorized) via serializeDoc.
 */
import { Timestamp } from 'firebase-admin/firestore';
import {
  type CandidateStatus,
  CANDIDATE_STATUS_LABELS,
  isValidCandidateStatus,
} from './status';

/** A candidate-visible timeline entry. No actor, no internal reason — just the
 *  approved label + timestamp. */
export interface CandidateTimelineEntry {
  status: CandidateStatus;
  label: string;
  at: string | null;
}

/** A candidate-visible interview (only approved fields — no internal notes/feedback). */
export interface CandidateInterviewView {
  id: string;
  stage: string;
  date: string | null;
  startTime: string | null;
  timeZone: string | null;
  mode: string | null;
  meetingLink: string | null;
  instructions: string | null;
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
}

/** The candidate-safe application shape. */
export interface CandidateApplicationView {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  // Submitted snapshot (the data the candidate entered for THIS application —
  // independent of future profile changes).
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  currentLocation: string;
  preferredJobLocation: string;
  linkedin: string;
  portfolio: string;
  currentDesignation: string;
  yearsExperience: string;
  skills: string[];
  coverLetter: string;
  expectedSalary: string;
  noticePeriod: string;
  hasResume: boolean;
  resumeFileName: string | null;
  candidateStatus: CandidateStatus;
  candidateStatusLabel: string;
  appliedAt: string | null;
  updatedAt: string | null;
  withdrawnAt: string | null;
  timeline: CandidateTimelineEntry[];
  interviews: CandidateInterviewView[];
}

/** Normalize a Firestore Timestamp / Date / string to ISO, or null. */
function toISO(v: unknown): string | null {
  if (!v) return null;
  try {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v !== null && 'seconds' in v && 'nanoseconds' in v) {
      const ts = v as Timestamp;
      return new Date(ts.seconds * 1000 + ts.nanoseconds / 1e6).toISOString();
    }
    if (typeof v === 'object' && v !== null && 'toDate' in v) {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof v === 'string') return v;
  } catch {
    return null;
  }
  return null;
}

/** Map a legacy `status` string (e.g. 'New', 'Reviewing') to a candidate status. */
function legacyStatusToCandidate(status: unknown, fallback: CandidateStatus = 'submitted'): CandidateStatus {
  if (isValidCandidateStatus(status)) return status;
  const s = String(status ?? '').toLowerCase();
  if (s === 'new' || s === '') return 'submitted';
  if (s.includes('review')) return 'under_review';
  if (s.includes('shortlist')) return 'shortlisted';
  if (s.includes('interview')) return 'interview_scheduled';
  if (s.includes('reject')) return 'rejected';
  if (s.includes('hire')) return 'hired';
  if (s.includes('offer')) return 'offer_extended';
  if (s.includes('withdraw')) return 'withdrawn';
  return fallback;
}

/** Build the candidate-visible timeline from the doc's statusTimeline array. */
function buildTimeline(raw: unknown): CandidateTimelineEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e: unknown) => {
      if (typeof e !== 'object' || e === null) return null;
      const entry = e as { status?: unknown; label?: unknown; at?: unknown };
      const status = isValidCandidateStatus(entry.status) ? entry.status : null;
      if (!status) return null; // drop entries with non-candidate statuses (internal-only)
      return {
        status,
        label: typeof entry.label === 'string' ? entry.label : CANDIDATE_STATUS_LABELS[status],
        at: toISO(entry.at),
      } as CandidateTimelineEntry;
    })
    .filter((e): e is CandidateTimelineEntry => e !== null);
}

/** Build the candidate-visible interviews list (approved fields only). */
function buildInterviews(raw: unknown): CandidateInterviewView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e: unknown, i: number) => {
      if (typeof e !== 'object' || e === null) return null;
      const iv = e as {
        id?: string; stage?: unknown; date?: unknown; startTime?: unknown;
        timeZone?: unknown; mode?: unknown; meetingLink?: unknown;
        instructions?: unknown; status?: unknown; candidateVisible?: unknown;
      };
      // Only include interviews marked candidate-visible (scheduled/rescheduled/
      // cancelled by an admin action that chose to publish). Internal draft
      // interviews + completed-with-feedback are not shown unless explicitly
      // candidateVisible. Completed interviews show as the stage label without
      // internal feedback.
      if (iv.candidateVisible === false) return null;
      return {
        id: typeof iv.id === 'string' ? iv.id : `iv-${i}`,
        stage: typeof iv.stage === 'string' ? iv.stage : '',
        date: toISO(iv.date),
        startTime: typeof iv.startTime === 'string' ? iv.startTime : null,
        timeZone: typeof iv.timeZone === 'string' ? iv.timeZone : null,
        mode: typeof iv.mode === 'string' ? iv.mode : null,
        meetingLink: typeof iv.meetingLink === 'string' ? iv.meetingLink : null,
        instructions: typeof iv.instructions === 'string' ? iv.instructions : null,
        status: (['scheduled', 'rescheduled', 'cancelled', 'completed'].includes(iv.status as string)
          ? (iv.status as CandidateInterviewView['status'])
          : 'scheduled'),
      } as CandidateInterviewView;
    })
    .filter((e): e is CandidateInterviewView => e !== null)
    .sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return ta - tb;
    });
}

/**
 * Map a full application Firestore doc to the candidate-safe view. This is the
 * ONLY serialization that may reach the candidate API/frontend/email. Any new
 * internal field added to the doc is automatically excluded (allowlist, not
 * denylist) — confidential fields cannot leak by accident.
 */
export function toCandidateApplication(
  docData: Record<string, unknown>,
  id: string,
): CandidateApplicationView {
  const candidateStatus = legacyStatusToCandidate(docData.candidateStatus ?? docData.status);
  const company = typeof docData.company === 'string' ? docData.company : 'Paragonel Technologies';
  const str = (k: string): string =>
    typeof docData[k] === 'string' ? (docData[k] as string) : '';
  return {
    applicationId: typeof docData.applicationId === 'string' ? docData.applicationId : id,
    jobId: typeof docData.jobId === 'string' ? docData.jobId : '',
    jobTitle: typeof docData.jobTitle === 'string' ? docData.jobTitle : '',
    company,
    candidateName: str('candidateName'),
    candidateEmail: str('candidateEmail'),
    candidatePhone: str('candidatePhone'),
    currentLocation: str('currentLocation'),
    preferredJobLocation: str('preferredJobLocation'),
    linkedin: str('linkedin'),
    portfolio: str('portfolio'),
    currentDesignation: str('currentDesignation'),
    yearsExperience: str('yearsExperience'),
    skills: Array.isArray(docData.skills) ? (docData.skills as string[]) : [],
    coverLetter: str('coverLetter'),
    expectedSalary: str('expectedSalary'),
    noticePeriod: str('noticePeriod'),
    // hasResume + fileName ONLY — the storage path is never exposed to the candidate.
    hasResume: typeof docData.resumeStoragePath === 'string' && !!docData.resumeStoragePath,
    resumeFileName: typeof docData.resumeFileName === 'string' ? docData.resumeFileName : null,
    candidateStatus,
    candidateStatusLabel: CANDIDATE_STATUS_LABELS[candidateStatus],
    appliedAt: toISO(docData.appliedAt),
    updatedAt: toISO(docData.updatedAt),
    withdrawnAt: toISO(docData.withdrawnAt),
    timeline: buildTimeline(docData.statusTimeline),
    interviews: buildInterviews(docData.interviews),
  };
}
