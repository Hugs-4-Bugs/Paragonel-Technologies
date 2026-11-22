/**
 * process.ts — bounded, idempotent processing of job-match events
 * (Prompt 05R §7, §8, §10).
 *
 * Pipeline (per event):
 *   1. Load the event. If missing / 'processed' / 'cancelled' -> no-op (idempotent).
 *   2. Mark 'processing'.
 *   3. Load the job. If missing / !isActive / deletedAt -> mark event 'cancelled'
 *      (never notify for deleted/inactive/draft jobs).
 *   4. Query OPTED-IN candidates (`jobAlertPreference == true`) in a bounded batch.
 *   5. For each candidate:
 *        - dedupKey(candidateEmail, jobId, version). If a 'sent' record already
 *          exists -> skip (no duplicate successful delivery).
 *        - Resolve threshold (clamped 25-100, default 80) + re-confirm opt-in.
 *        - scoreJobCandidate(job, profile); meetsThreshold(result, threshold).
 *        - Below threshold / no required skills -> record 'skipped', no email.
 *        - Passes -> sendJobMatchAlert(...). On status 'sent' -> record 'sent' +
 *          deliveredAt. On 'failed'/'skipped' -> record 'failed' with redacted
 *          reason. NEVER claim success when the provider did not accept the msg.
 *      Stop after maxAlertsPerRun sends (bounded).
 *   6. Update event stats + status 'processed'.
 *
 * Email sending is INJECTED (sendAlert) so unit tests can mock provider
 * success/failure without a real SMTP server. The store is a structural subset
 * of the Admin Firestore SDK (works with the in-memory fake-firestore).
 *
 * Backfill (Prompt 05R §10): `backfillCandidate` evaluates ONE opted-in
 * candidate against currently-published jobs, bounded + deduped, OFF by default
 * (admin must trigger it explicitly). Never re-sends an already-delivered alert.
 */
import { Timestamp } from 'firebase-admin/firestore';
import type { CandidateProfile } from '@/lib/auth/candidate-profile';
import { scoreJobCandidate, meetsThreshold, type MatchResult, type JobForMatching } from '@/lib/matching/match-engine';
import { resolveMatchingThreshold, resolveJobAlertPreference } from '@/lib/matching/preferences';
import {
  JOB_ALERTS_SENT_COLLECTION,
  JOB_MATCH_EVENTS_COLLECTION,
  dedupKey,
  redactReason,
} from './dedup';
import { getJobMatchEvent, type JobMatchStore } from './trigger';
import { eventId } from './dedup';
import { unsubscribeUrl } from './unsubscribe';

/** A store with query support (where/limit/get) — the Admin SDK + fake satisfy this. */
export interface JobAlertDataStore extends JobMatchStore {
  collection(name: string): JobMatchStore['collection'] extends (n: string) => infer R
    ? R & {
        where(field: string, op: string, value: unknown): {
          limit(n: number): { get(): Promise<QuerySnap> };
          get(): Promise<QuerySnap>;
          orderBy(field: string, dir?: 'asc' | 'desc'): { limit(n: number): { get(): Promise<QuerySnap> }; get(): Promise<QuerySnap> };
        };
        orderBy(field: string, dir?: 'asc' | 'desc'): { limit(n: number): { get(): Promise<QuerySnap> }; get(): Promise<QuerySnap> };
        limit(n: number): { get(): Promise<QuerySnap> };
        get(): Promise<QuerySnap>;
      }
    : never;
}
export interface QuerySnap {
  empty: boolean;
  size: number;
  docs: { id: string; data: () => Record<string, unknown> | undefined }[];
}

/** Injected email sender — returns an EmailResult-shaped object. */
export interface AlertSender {
  (input: {
    to: string;
    job: JobForMatching;
    match: MatchResult;
    threshold: number;
    manageUrl: string;
    unsubscribeUrl: string;
  }): Promise<{ status: 'sent' | 'skipped' | 'failed'; detail?: string; messageId?: string }>;
}

export interface ProcessOptions {
  candidateBatchSize?: number;
  maxAlertsPerRun?: number;
  maxEventsPerRun?: number;
  appBaseUrl?: string;
}

const DEFAULTS = {
  candidateBatchSize: 50,
  maxAlertsPerRun: 20,
  maxEventsPerRun: 5,
};

export interface ProcessOutcome {
  eventId: string;
  status: string;
  candidatesEvaluated: number;
  alertsSent: number;
  alertsSkipped: number;
  alertsFailed: number;
  cancelled?: boolean;
  reason?: string;
}

/** Mark an event's status + stats (best-effort; never throws). */
async function setEventStatus(
  db: JobMatchStore,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection(JOB_MATCH_EVENTS_COLLECTION).doc(id).update(patch);
  } catch {
    /* best-effort; dedup collection keeps retries safe */
  }
}

/** Read a job doc and confirm it is still published. Returns the job or null. */
async function loadPublishedJob(
  db: JobAlertDataStore,
  jobId: string
): Promise<{ id: string } & Record<string, unknown> | null> {
  if (!jobId) return null;
  const snap = await db.collection('jobs').doc(jobId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const isActive = data.isActive === true;
  const deletedAt = data.deletedAt;
  if (!isActive || deletedAt) return null;
  return { id: snap.id, ...data };
}

/** Record (or update) a jobAlertsSent outcome doc. Idempotent on the dedup key. */
async function recordAlertOutcome(
  db: JobAlertDataStore,
  key: string,
  fields: Record<string, unknown>
): Promise<void> {
  const ref = db.collection(JOB_ALERTS_SENT_COLLECTION).doc(key);
  const snap = await ref.get();
  const attemptCount = snap.exists
    ? Number((snap.data() as { attemptCount?: unknown })?.attemptCount || 0) + 1
    : 1;
  const now = Timestamp.now();
  if (snap.exists) {
    await ref.update({ ...fields, attemptCount, updatedAt: now });
  } else {
    await ref.set({ ...fields, attemptCount, dedupKey: key, createdAt: now, updatedAt: now });
  }
}

/** True if a 'sent' record already exists for this key (duplicate-suppression). */
async function alreadyDelivered(db: JobAlertDataStore, key: string): Promise<boolean> {
  const snap = await db.collection(JOB_ALERTS_SENT_COLLECTION).doc(key).get();
  if (!snap.exists) return false;
  return String((snap.data() as { status?: unknown })?.status || '') === 'sent';
}

/**
 * Drain a single match event. Idempotent + bounded.
 */
export async function processJobMatchEvent(
  db: JobAlertDataStore,
  eventDocId: string,
  sendAlert: AlertSender,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome> {
  const candidateBatchSize = opts.candidateBatchSize ?? DEFAULTS.candidateBatchSize;
  const maxAlertsPerRun = opts.maxAlertsPerRun ?? DEFAULTS.maxAlertsPerRun;
  const baseUrl = opts.appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:3000';

  const event = await getJobMatchEvent(db, eventDocId);
  if (!event) {
    return { eventId: eventDocId, status: 'missing', candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 };
  }
  if (event.status === 'processed' || event.status === 'cancelled') {
    return {
      eventId: eventDocId,
      status: event.status,
      candidatesEvaluated: event.stats.candidatesEvaluated,
      alertsSent: event.stats.alertsSent,
      alertsSkipped: event.stats.alertsSkipped,
      alertsFailed: event.stats.alertsFailed,
    };
  }

  // Mark processing.
  await setEventStatus(db, eventDocId, { status: 'processing', attempts: (event.attempts || 0) + 1 });

  // Load + verify the job is still published.
  const job = await loadPublishedJob(db, event.jobId);
  if (!job) {
    await setEventStatus(db, eventDocId, {
      status: 'cancelled',
      processedAt: Timestamp.now(),
      lastError: 'job missing, inactive, or deleted at processing time',
    });
    return { eventId: eventDocId, status: 'cancelled', candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0, cancelled: true, reason: 'job no longer published' };
  }

  const jobVersion = Math.max(1, Math.floor(Number(event.jobVersion) || 1));
  const jobForMatching: JobForMatching = {
    id: job.id,
    jobId: String(job.jobId || job.id),
    title: String(job.title || ''),
    department: job.department ? String(job.department) : undefined,
    location: String(job.location || ''),
    employmentType: String(job.employmentType || ''),
    workArrangement: String(job.workArrangement || ''),
    experienceRequired: String(job.experienceRequired || ''),
    skills: Array.isArray(job.skills) ? job.skills.map(String) : [],
    preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills.map(String) : undefined,
    seniority: job.seniority ? String(job.seniority) : undefined,
    educationRequired: job.educationRequired ? String(job.educationRequired) : undefined,
    description: job.description ? String(job.description) : undefined,
  };

  // Query opted-in candidates in a bounded batch.
  let candidateSnap: QuerySnap;
  try {
    candidateSnap = await db
      .collection('candidates')
      .where('jobAlertPreference', '==', true)
      .limit(candidateBatchSize)
      .get();
  } catch (err) {
    await setEventStatus(db, eventDocId, {
      status: 'failed',
      lastError: redactReason(err),
    });
    return { eventId: eventDocId, status: 'failed', candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0, reason: redactReason(err) };
  }

  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of candidateSnap.docs) {
    if (sent >= maxAlertsPerRun) break; // bounded sends per run
    const profile = doc.data() as CandidateProfile | undefined;
    if (!profile) continue;
    // Re-confirm opt-in server-side (never trust a stale query alone).
    if (!resolveJobAlertPreference(profile.jobAlertPreference)) continue;
    const email = (profile.email || doc.id || '').toString().trim().toLowerCase();
    if (!email) continue;
    evaluated++;

    const key = dedupKey(email, job.id, jobVersion);
    // Duplicate suppression: a successfully delivered alert is never re-sent.
    if (await alreadyDelivered(db, key)) {
      skipped++;
      continue;
    }

    const threshold = resolveMatchingThreshold(profile.matchingThreshold);
    const result = scoreJobCandidate(jobForMatching, profile as unknown as Parameters<typeof scoreJobCandidate>[1]);
    const decision = meetsThreshold(result, threshold);

    if (!decision.pass) {
      // Below threshold or no required skills -> record 'skipped', no email.
      await recordAlertOutcome(db, key, {
        candidateEmail: email,
        jobId: job.id,
        jobVersion,
        score: result.overallScore,
        threshold,
        eligible: false,
        status: 'skipped',
        reason: decision.reason,
      });
      skipped++;
      continue;
    }

    // Passes threshold -> send the alert.
    const manageUrl = `${baseUrl}/candidate/profile`;
    const unsubUrl = unsubscribeUrl(email, baseUrl) || `${baseUrl}/candidate/profile`;
    let outcome: { status: 'sent' | 'skipped' | 'failed'; detail?: string; messageId?: string };
    try {
      outcome = await sendAlert({ to: email, job: jobForMatching, match: result, threshold, manageUrl, unsubscribeUrl: unsubUrl });
    } catch (err) {
      outcome = { status: 'failed', detail: redactReason(err) };
    }

    if (outcome.status === 'sent') {
      await recordAlertOutcome(db, key, {
        candidateEmail: email,
        jobId: job.id,
        jobVersion,
        score: result.overallScore,
        threshold,
        eligible: true,
        status: 'sent',
        deliveredAt: Timestamp.now(),
        messageId: outcome.messageId || null,
      });
      sent++;
    } else {
      // Provider did not accept -> record failed, redacted reason. Never claim success.
      await recordAlertOutcome(db, key, {
        candidateEmail: email,
        jobId: job.id,
        jobVersion,
        score: result.overallScore,
        threshold,
        eligible: true,
        status: 'failed',
        failureReason: redactReason(outcome.detail || 'send-failed'),
      });
      failed++;
    }
  }

  const status = failed > 0 && sent === 0 ? 'failed' : 'processed';
  await setEventStatus(db, eventDocId, {
    status,
    processedAt: Timestamp.now(),
    stats: { candidatesEvaluated: evaluated, alertsSent: sent, alertsSkipped: skipped, alertsFailed: failed },
  });

  return {
    eventId: eventDocId,
    status,
    candidatesEvaluated: evaluated,
    alertsSent: sent,
    alertsSkipped: skipped,
    alertsFailed: failed,
  };
}

/**
 * Drain up to `maxEventsPerRun` pending events. Bounded so a single admin call
 * cannot run unbounded work.
 */
export async function processPendingJobMatchEvents(
  db: JobAlertDataStore,
  sendAlert: AlertSender,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome[]> {
  const maxEventsPerRun = opts.maxEventsPerRun ?? DEFAULTS.maxEventsPerRun;
  let snap: QuerySnap;
  try {
    snap = await db
      .collection(JOB_MATCH_EVENTS_COLLECTION)
      .where('status', '==', 'pending')
      .limit(maxEventsPerRun)
      .get();
  } catch {
    return [];
  }
  const outcomes: ProcessOutcome[] = [];
  for (const doc of snap.docs) {
    const outcome = await processJobMatchEvent(db, doc.id, sendAlert, opts);
    outcomes.push(outcome);
  }
  return outcomes;
}

/**
 * Bounded backfill for a SINGLE candidate (Prompt 05R §10). Evaluates the
 * candidate against currently-published jobs only. Deduped — never re-sends an
 * already-delivered alert. OFF by default; an admin must trigger it explicitly.
 */
export async function backfillCandidate(
  db: JobAlertDataStore,
  candidateEmail: string,
  sendAlert: AlertSender,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome> {
  const email = (candidateEmail || '').trim().toLowerCase();
  const baseUrl = opts.appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:3000';
  const maxAlertsPerRun = opts.maxAlertsPerRun ?? DEFAULTS.maxAlertsPerRun;
  const jobBatch = opts.candidateBatchSize ?? 50;

  const empty: ProcessOutcome = {
    eventId: `backfill:${email}`,
    status: 'no-op',
    candidatesEvaluated: 0,
    alertsSent: 0,
    alertsSkipped: 0,
    alertsFailed: 0,
  };
  if (!email) return { ...empty, reason: 'no email' };

  const profSnap = await db.collection('candidates').doc(email).get();
  if (!profSnap.exists) return { ...empty, status: 'no-profile', reason: 'candidate profile not found' };
  const profile = profSnap.data() as CandidateProfile | undefined;
  if (!profile) return { ...empty, status: 'no-profile' };
  // Backfill respects the opt-in: a candidate who has not enabled alerts is NOT
  // sent historical alerts. They may enable alerts + then an admin runs this.
  if (!resolveJobAlertPreference(profile.jobAlertPreference)) {
    return { ...empty, status: 'opted-out', reason: 'candidate has not opted in to job alerts' };
  }
  const threshold = resolveMatchingThreshold(profile.matchingThreshold);

  // Only currently published jobs (bounded; no historical flood).
  let jobsSnap: QuerySnap;
  try {
    jobsSnap = await db
      .collection('jobs')
      .where('isActive', '==', true)
      .limit(jobBatch)
      .get();
  } catch (err) {
    return { ...empty, status: 'failed', reason: redactReason(err) };
  }

  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const jdoc of jobsSnap.docs) {
    if (sent >= maxAlertsPerRun) break;
    const jdata = jdoc.data() || {};
    if (jdata.deletedAt) continue; // safety: skip soft-deleted
    const version = Math.max(1, Math.floor(Number(jdata.version) || 1));
    const key = dedupKey(email, jdoc.id, version);
    if (await alreadyDelivered(db, key)) {
      skipped++;
      continue;
    }
    evaluated++;
    const jobForMatching: JobForMatching = {
      id: jdoc.id,
      jobId: String(jdata.jobId || jdoc.id),
      title: String(jdata.title || ''),
      department: jdata.department ? String(jdata.department) : undefined,
      location: String(jdata.location || ''),
      employmentType: String(jdata.employmentType || ''),
      workArrangement: String(jdata.workArrangement || ''),
      experienceRequired: String(jdata.experienceRequired || ''),
      skills: Array.isArray(jdata.skills) ? jdata.skills.map(String) : [],
      preferredSkills: Array.isArray(jdata.preferredSkills) ? jdata.preferredSkills.map(String) : undefined,
      seniority: jdata.seniority ? String(jdata.seniority) : undefined,
      educationRequired: jdata.educationRequired ? String(jdata.educationRequired) : undefined,
      description: jdata.description ? String(jdata.description) : undefined,
    };
    const result = scoreJobCandidate(jobForMatching, profile as unknown as Parameters<typeof scoreJobCandidate>[1]);
    const decision = meetsThreshold(result, threshold);
    if (!decision.pass) {
      await recordAlertOutcome(db, key, {
        candidateEmail: email, jobId: jdoc.id, jobVersion: version,
        score: result.overallScore, threshold, eligible: false,
        status: 'skipped', reason: decision.reason,
      });
      skipped++;
      continue;
    }
    const manageUrl = `${baseUrl}/candidate/profile`;
    const unsubUrl = unsubscribeUrl(email, baseUrl) || `${baseUrl}/candidate/profile`;
    let outcome: { status: 'sent' | 'skipped' | 'failed'; detail?: string; messageId?: string };
    try {
      outcome = await sendAlert({ to: email, job: jobForMatching, match: result, threshold, manageUrl, unsubscribeUrl: unsubUrl });
    } catch (err) {
      outcome = { status: 'failed', detail: redactReason(err) };
    }
    if (outcome.status === 'sent') {
      await recordAlertOutcome(db, key, {
        candidateEmail: email, jobId: jdoc.id, jobVersion: version,
        score: result.overallScore, threshold, eligible: true,
        status: 'sent', deliveredAt: Timestamp.now(), messageId: outcome.messageId || null,
      });
      sent++;
    } else {
      await recordAlertOutcome(db, key, {
        candidateEmail: email, jobId: jdoc.id, jobVersion: version,
        score: result.overallScore, threshold, eligible: true,
        status: 'failed', failureReason: redactReason(outcome.detail || 'send-failed'),
      });
      failed++;
    }
  }

  return {
    eventId: `backfill:${email}`,
    status: failed > 0 && sent === 0 ? 'failed' : 'processed',
    candidatesEvaluated: evaluated,
    alertsSent: sent,
    alertsSkipped: skipped,
    alertsFailed: failed,
  };
}

// Re-export eventId for route wiring convenience.
export { eventId };
