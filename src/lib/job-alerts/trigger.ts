/**
 * trigger.ts — the new-job publication trigger (Prompt 05R §7).
 *
 * A candidate is evaluated ONLY when a job transitions into a genuinely
 * published/active state. This module decides WHEN to enqueue a match event and
 * does so idempotently.
 *
 * Notification policy (documented, Prompt 05R §7):
 *   - Create a job with status 'Active'             -> enqueue (trigger 'create')
 *   - Toggle a job Draft -> Active (PATCH isActive) -> enqueue (trigger 'activate')
 *   - Edit a job while Active AND a MATERIAL field changes -> bump version +
 *     enqueue (trigger 'material_update'). Candidates may now match differently.
 *   - Edit a job while Active with NO material change (e.g. salary, deadline,
 *     description-only tweaks that don't affect matching) -> NO enqueue. This is
 *     the "do not repeatedly notify on unrelated edits" rule.
 *   - Toggle Active -> Draft (archive)              -> NO enqueue (no alerts for inactive)
 *   - Delete a job                                  -> NO enqueue (no alerts for deleted)
 *   - Re-activate a job whose version is unchanged  -> NO re-enqueue: the event id
 *     is stable per (job,version), and a processed event is not re-armed. So
 *     toggling a job off/on without a material edit does NOT spam candidates.
 *
 * Idempotency: the event doc id is `eventId(jobId, version)`. Re-enqueuing the
 * same (job,version) finds an existing doc; if it is already 'processed' or
 * 'processing' it is left alone, so retries never create duplicate events.
 *
 * This module takes a `JobMatchStore` (a tiny structural subset of the Admin
 * Firestore SDK) so it is unit-testable with the in-memory fake-firestore.
 */
import { Timestamp } from 'firebase-admin/firestore';
import {
  JOB_MATCH_EVENTS_COLLECTION,
  eventId,
} from './dedup';

/** A minimal structural subset of the Admin Firestore SDK used by the trigger. */
export interface JobMatchStore {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | undefined }>;
      set(data: Record<string, unknown>, opts?: { merge?: boolean }): Promise<void>;
      update(patch: Record<string, unknown>): Promise<void>;
    };
  };
}

export type JobMatchTriggerKind = 'create' | 'activate' | 'material_update';

export interface JobMatchEvent {
  jobId: string; // Firestore doc id of the job
  jobVersion: number;
  trigger: JobMatchTriggerKind;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'cancelled';
  createdAt: unknown; // Timestamp
  processedAt?: unknown;
  attempts: number;
  /** Timestamp the event was claimed for processing (for stuck-recovery, 05S §6). */
  claimedAt?: unknown;
  /** Doc id of the last candidate evaluated in the current pass — paginates
   * opted-in candidates across bounded drain calls (05S §6: "candidate
   * pagination and processing beyond the first batch"). */
  lastCandidateId?: string;
  stats: {
    candidatesEvaluated: number;
    alertsSent: number;
    alertsSkipped: number;
    alertsFailed: number;
  };
  lastError?: string;
}

/**
 * Fields whose change is "material" for matching (Prompt 05R §7: edits to these
 * warrant re-evaluation; edits to other fields do not). skills + preferredSkills
 * are arrays; the rest are strings.
 */
export const MATERIAL_JOB_FIELDS = [
  'title',
  'department',
  'location',
  'employmentType',
  'workArrangement',
  'experienceRequired',
  'skills',
  'preferredSkills',
  'seniority',
  'educationRequired',
] as const;

/** Normalize an array-ish field to a sorted canonical string for comparison. */
function normArray(v: unknown): string {
  if (!Array.isArray(v)) return '';
  return [...v]
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
}
function normScalar(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim().toLowerCase();
}

/**
 * Compare a previous job doc to a new set of form values and decide whether a
 * MATERIAL field changed. Only material changes re-trigger matching.
 */
export function isMaterialJobChange(
  prev: Record<string, unknown> | undefined | null,
  next: Record<string, unknown>
): boolean {
  if (!prev) return true; // no previous doc -> treat as material (first publish)
  for (const f of MATERIAL_JOB_FIELDS) {
    const p = prev[f];
    const n = next[f];
    if (f === 'skills' || f === 'preferredSkills') {
      if (normArray(p) !== normArray(n)) return true;
    } else {
      if (normScalar(p) !== normScalar(n)) return true;
    }
  }
  return false;
}

/** Should a freshly-created job enqueue a match event? Only if published/active. */
export function shouldEnqueueOnCreate(values: { status?: string }): JobMatchTriggerKind | null {
  return isPublishedStatus(values.status) ? 'create' : null;
}

/** Should a toggle enqueue? Only when going to active. */
export function shouldEnqueueOnToggle(prevIsActive: boolean, newIsActive: boolean): JobMatchTriggerKind | null {
  if (newIsActive && !prevIsActive) return 'activate';
  return null; // archiving or no-op toggle -> no enqueue
}

/**
 * Should an update (PUT) enqueue? Returns the trigger kind or null.
 *   - Draft at any point                              -> null (never notify for drafts)
 *   - prev not Active, next Active                    -> 'activate' (published transition)
 *   - prev Active, next Active, material change       -> 'material_update'
 *   - prev Active, next Active, no material change    -> null (unrelated edit)
 *   - next not Active                                 -> null (unpublished)
 */
export function shouldEnqueueOnUpdate(
  prev: Record<string, unknown> | undefined | null,
  next: { status?: string } & Record<string, unknown>
): JobMatchTriggerKind | null {
  if (!isPublishedStatus(next.status)) return null;
  const prevActive = prev ? isPublishedStatus(String(prev.status ?? '')) : false;
  if (!prevActive) return 'activate';
  return isMaterialJobChange(prev, next) ? 'material_update' : null;
}

/** A job is "published" when status === 'Active' (the CMS's active state). */
export function isPublishedStatus(status: string | undefined | null): boolean {
  return (status || '').trim().toLowerCase() === 'active';
}

/**
 * Compute the job version after an update. Bumps ONLY on a material change or a
 * publish transition; otherwise the version is unchanged (so an unrelated edit
 * does not create a new event id and does not re-notify).
 */
export function computeJobVersion(
  prevVersion: number | undefined | null,
  prev: Record<string, unknown> | undefined | null,
  next: { status?: string } & Record<string, unknown>
): number {
  const base = Math.max(1, Math.floor(Number(prevVersion) || 1));
  const trigger = shouldEnqueueOnUpdate(prev, next);
  return trigger ? base + 1 : base;
}

/**
 * Idempotently enqueue a match event for a (job, version). If an event doc with
 * the same id already exists and is 'processed' or 'processing', it is left as-is
 * (no duplicate). If it exists as 'failed' or 'pending', it is re-armed to
 * 'pending'. If it does not exist, it is created as 'pending'.
 *
 * Returns true if a pending event exists after this call (i.e. the caller may
 * drain it), false if the event was already processed/processing and skipped.
 */
export async function enqueueJobMatchEvent(
  db: JobMatchStore,
  input: { jobId: string; jobVersion: number; trigger: JobMatchTriggerKind }
): Promise<boolean> {
  const id = eventId(input.jobId, input.jobVersion);
  const col = db.collection(JOB_MATCH_EVENTS_COLLECTION).doc(id);
  const snap = await col.get();
  if (snap.exists) {
    const data = snap.data() || {};
    const status = String(data.status ?? 'pending');
    if (status === 'processed' || status === 'processing') {
      // Already handled or in-flight — do not duplicate.
      return false;
    }
    // Re-arm a failed/pending event for retry.
    await col.update({ status: 'pending', trigger: input.trigger, lastError: null });
    return true;
  }
  const event: JobMatchEvent = {
    jobId: input.jobId,
    jobVersion: input.jobVersion,
    trigger: input.trigger,
    status: 'pending',
    createdAt: Timestamp.now(),
    attempts: 0,
    stats: { candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 },
  };
  await col.set(event as unknown as Record<string, unknown>);
  return true;
}

/** Read an event doc (or null). Used by the processor + tests. */
export async function getJobMatchEvent(
  db: JobMatchStore,
  id: string
): Promise<JobMatchEvent | null> {
  const snap = await db.collection(JOB_MATCH_EVENTS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as unknown as JobMatchEvent;
}
