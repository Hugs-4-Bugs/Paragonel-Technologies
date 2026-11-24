/**
 * process.ts — bounded, idempotent processing of job-match events
 * (Prompt 05R §7, §8, §10; 05S §6 concurrency/pagination hardening).
 *
 * 05S hardening (defects fixed vs the 05R version):
 *   - ATOMIC CLAIM: the event is claimed via a Firestore transaction
 *     (status pending/failed/stuck -> processing + claimedAt). Two concurrent
 *     workers cannot both process the same event.
 *   - PAGINATION: opted-in candidates are paged with startAfter(cursor) across
 *     bounded drain calls. Candidates beyond the first batch ARE evaluated
 *     (the 05R version only processed the first `candidateBatchSize` and marked
 *     the event processed — a real defect). The cursor (lastCandidateId) +
 *     cumulative stats are stored on the event so the next drain resumes.
 *   - STUCK RECOVERY: recoverStuckEvents() resets events stuck in 'processing'
 *     longer than stuckTimeoutMs back to 'pending', so a crashed worker cannot
 *     strand an event forever.
 *   - ATOMIC DEDUP: before sending, a transaction claims the jobAlertsSent doc
 *     (-> 'sending'); a concurrent worker that already delivered/in-flight is
 *     skipped. So even under concurrent workers, a candidate never receives a
 *     duplicate successful delivery.
 *
 * Email sending is INJECTED (sendAlert) so unit tests can mock provider
 * success/failure without a real SMTP server. The store is a structural subset
 * of the Admin Firestore SDK (works with the in-memory fake-firestore, whose
 * runTransaction is serialized so concurrency tests are meaningful).
 */
import { Timestamp } from 'firebase-admin/firestore';
import type { CandidateProfile } from '@/lib/auth/candidate-profile';
import { scoreJobCandidate, meetsThreshold, type MatchResult, type JobForMatching } from '@/lib/matching/match-engine';
import { resolveMatchingThreshold, resolveJobAlertPreference } from '@/lib/matching/preferences';
import { getGlobalMatchingThreshold } from '@/lib/matching/global-threshold';
import {
  JOB_ALERTS_SENT_COLLECTION,
  JOB_MATCH_EVENTS_COLLECTION,
  dedupKey,
  redactReason,
} from './dedup';
import { type JobMatchStore } from './trigger';
import { eventId } from './dedup';
import { unsubscribeUrl } from './unsubscribe';

/** Chainable query subset used by the processor (where/orderBy/limit/startAfter/get). */
export interface QueryChain {
  where(field: string, op: string, value: unknown): QueryChain;
  orderBy(field: string, dir?: 'asc' | 'desc'): QueryChain;
  limit(n: number): QueryChain;
  startAfter(cursor: { id: string } | string): QueryChain;
  get(): Promise<QuerySnap>;
}
/** Transaction subset (real Admin SDK + serialized fake both satisfy this). */
export interface TxLike {
  get(ref: unknown): Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | undefined } | QuerySnap>;
  set(ref: unknown, data: Record<string, unknown>, opts?: { merge?: boolean }): void;
  update(ref: unknown, data: Record<string, unknown>): void;
}

/** A store with query + transaction support — the Admin SDK + fake satisfy this. */
export interface JobAlertDataStore extends JobMatchStore {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | undefined }>;
      set(data: Record<string, unknown>, opts?: { merge?: boolean }): Promise<void>;
      update(patch: Record<string, unknown>): Promise<void>;
    };
    where(field: string, op: string, value: unknown): QueryChain;
    orderBy(field: string, dir?: 'asc' | 'desc'): QueryChain;
    limit(n: number): QueryChain;
    startAfter(cursor: { id: string } | string): QueryChain;
    get(): Promise<QuerySnap>;
  };
  runTransaction<T>(cb: (tx: TxLike) => Promise<T>): Promise<T>;
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
  /** Max time an event may stay 'processing' before recoverStuckEvents re-arms it. */
  stuckTimeoutMs?: number;
}

const DEFAULTS = {
  candidateBatchSize: 50,
  maxAlertsPerRun: 20,
  maxEventsPerRun: 5,
  stuckTimeoutMs: 5 * 60 * 1000, // 5 minutes
};

export interface ProcessOutcome {
  eventId: string;
  status: string;
  candidatesEvaluated: number;
  alertsSent: number;
  alertsSkipped: number;
  alertsFailed: number;
  cancelled?: boolean;
  partial?: boolean;
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

/** Record (or update) a jobAlertsSent outcome doc (non-send path: skipped/failed). */
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

/**
 * Atomically claim an event for processing via a transaction. Returns
 * {claimed:true, event} if this caller acquired the claim (status was pending,
 * failed, or stuck-processing); {claimed:false, event} otherwise (already
 * processed/cancelled, or actively processing + not stale).
 */
async function claimEvent(
  db: JobAlertDataStore,
  eventDocId: string,
  stuckTimeoutMs: number
): Promise<{ claimed: boolean; event: Record<string, unknown> | null }> {
  return db.runTransaction(async (tx) => {
    const ref = db.collection(JOB_MATCH_EVENTS_COLLECTION).doc(eventDocId);
    const snap = (await tx.get(ref)) as { exists: boolean; data: () => Record<string, unknown> | undefined };
    if (!snap.exists) return { claimed: false, event: null };
    const data = (snap.data() || {}) as Record<string, unknown>;
    const status = String(data.status || 'pending');
    if (status === 'processed' || status === 'cancelled') {
      return { claimed: false, event: data };
    }
    if (status === 'processing') {
      const claimedMs = toMillis(data.claimedAt);
      if (claimedMs && Date.now() - claimedMs < stuckTimeoutMs) {
        return { claimed: false, event: data };
      }
      // stale -> fall through to reclaim
    }
    const attempts = Number(data.attempts || 0) + 1;
    const now = Timestamp.now();
    tx.update(ref, { status: 'processing', claimedAt: now, attempts, lastError: null });
    return { claimed: true, event: { ...data, status: 'processing', claimedAt: now, attempts } };
  });
}

/** Coerce a stored timestamp (Admin Timestamp / number / Date) to epoch ms. */
function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'object' && v !== null && 'toMillis' in v) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  return 0;
}

/**
 * Reset events stuck in 'processing' longer than stuckTimeoutMs back to
 * 'pending' so a crashed worker cannot strand an event. Returns the count
 * recovered. Called by processPendingJobMatchEvents before draining.
 */
export async function recoverStuckEvents(
  db: JobAlertDataStore,
  stuckTimeoutMs: number = DEFAULTS.stuckTimeoutMs
): Promise<number> {
  let snap: QuerySnap;
  try {
    snap = await db.collection(JOB_MATCH_EVENTS_COLLECTION).where('status', '==', 'processing').limit(50).get();
  } catch {
    return 0;
  }
  const cutoff = Date.now() - stuckTimeoutMs;
  let recovered = 0;
  for (const doc of snap.docs) {
    const data = (doc.data() || {}) as Record<string, unknown>;
    const claimedAtRaw = data.claimedAt;
    const claimedMs =
      claimedAtRaw && typeof claimedAtRaw === 'object' && 'toMillis' in claimedAtRaw
        ? (claimedAtRaw as { toMillis: () => number }).toMillis()
        : typeof claimedAtRaw === 'number'
          ? claimedAtRaw
          : 0;
    if (claimedMs && claimedMs < cutoff) {
      try {
        await db.collection(JOB_MATCH_EVENTS_COLLECTION).doc(doc.id).update({
          status: 'pending',
          claimedAt: null,
          lastError: 'recovered from stuck processing (timeout)',
        });
        recovered++;
      } catch {
        /* best-effort */
      }
    }
  }
  return recovered;
}

/**
 * Drain a single match event. Idempotent + bounded + paginated.
 *
 * Processes opted-in candidates in batches (startAfter cursor) until either all
 * candidates are evaluated (-> 'processed') or the per-run send cap is hit
 * (-> 'pending' with lastCandidateId + cumulative stats, resumed by the next
 * drain). Atomic claim + atomic dedup make concurrent workers safe.
 */
export async function processJobMatchEvent(
  db: JobAlertDataStore,
  eventDocId: string,
  sendAlert: AlertSender,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome> {
  const candidateBatchSize = opts.candidateBatchSize ?? DEFAULTS.candidateBatchSize;
  const maxAlertsPerRun = opts.maxAlertsPerRun ?? DEFAULTS.maxAlertsPerRun;
  const stuckTimeoutMs = opts.stuckTimeoutMs ?? DEFAULTS.stuckTimeoutMs;
  const baseUrl = opts.appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:3000';

  const ZERO: ProcessOutcome = { eventId: eventDocId, status: 'missing', candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 };

  // Atomic claim.
  let claim: { claimed: boolean; event: Record<string, unknown> | null };
  try {
    claim = await claimEvent(db, eventDocId, stuckTimeoutMs);
  } catch (err) {
    return { ...ZERO, status: 'failed', reason: redactReason(err) };
  }
  if (!claim.event) return ZERO;
  const event = claim.event as Record<string, unknown>;
  const evStatus = String(event.status || 'pending');
  if (!claim.claimed) {
    // Already processed/cancelled, or actively processing (not stale).
    if (evStatus === 'processed' || evStatus === 'cancelled') {
      const s = (event.stats || {}) as Record<string, number>;
      return { eventId: eventDocId, status: evStatus, candidatesEvaluated: s.candidatesEvaluated || 0, alertsSent: s.alertsSent || 0, alertsSkipped: s.alertsSkipped || 0, alertsFailed: s.alertsFailed || 0, cancelled: evStatus === 'cancelled' };
    }
    return { ...ZERO, status: 'processing', reason: 'event already in flight by another worker' };
  }

  const jobId = String(event.jobId || '');
  const jobVersion = Math.max(1, Math.floor(Number(event.jobVersion) || 1));

  // Load + verify the job is still published.
  const job = await loadPublishedJob(db, jobId);
  if (!job) {
    await setEventStatus(db, eventDocId, {
      status: 'cancelled',
      processedAt: Timestamp.now(),
      claimedAt: null,
      lastError: 'job missing, inactive, or deleted at processing time',
    });
    return { ...ZERO, status: 'cancelled', cancelled: true, reason: 'job no longer published' };
  }

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

  // Resume from the stored cursor. Per-call deltas are returned to the caller;
  // cumulative (startStats + deltas) is stored on the event so its stats reflect
  // the total across all drain calls (pagination).
  const startStats = (event.stats || {}) as Record<string, number>;
  let cursor = typeof event.lastCandidateId === 'string' && event.lastCandidateId ? event.lastCandidateId : null;
  let evaluated = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let allDone = false;
  const cum = () => ({
    candidatesEvaluated: Number(startStats.candidatesEvaluated || 0) + evaluated,
    alertsSent: Number(startStats.alertsSent || 0) + sent,
    alertsSkipped: Number(startStats.alertsSkipped || 0) + skipped,
    alertsFailed: Number(startStats.alertsFailed || 0) + failed,
  });

  outer: while (true) {
    if (sent >= maxAlertsPerRun) break; // send cap -> partial
    let q: QueryChain = db
      .collection('candidates')
      .where('jobAlertPreference', '==', true)
      .orderBy('__name__')
      .limit(candidateBatchSize);
    if (cursor) q = q.startAfter(cursor);
    let batchSnap: QuerySnap;
    try {
      batchSnap = await q.get();
    } catch (err) {
      // Persist the cursor + CUMULATIVE stats so a retry resumes from where this
      // run left off (no re-evaluation of already-processed candidates).
      await setEventStatus(db, eventDocId, { status: 'failed', claimedAt: null, lastError: redactReason(err), lastCandidateId: cursor, stats: cum() });
      return { eventId: eventDocId, status: 'failed', candidatesEvaluated: evaluated, alertsSent: sent, alertsSkipped: skipped, alertsFailed: failed, reason: redactReason(err) };
    }
    if (batchSnap.size === 0) { allDone = true; break; }

    for (const doc of batchSnap.docs) {
      if (sent >= maxAlertsPerRun) break outer; // send cap -> partial (cursor stays at last evaluated)
      const profile = doc.data() as CandidateProfile | undefined;
      if (!profile) { cursor = doc.id; continue; }
      if (!resolveJobAlertPreference(profile.jobAlertPreference)) { cursor = doc.id; continue; }
      const email = (profile.email || doc.id || '').toString().trim().toLowerCase();
      if (!email) { cursor = doc.id; continue; }
      evaluated++;
      cursor = doc.id; // advance cursor past this evaluated candidate

      const key = dedupKey(email, job.id, jobVersion);
      const threshold = resolveMatchingThreshold(profile.matchingThreshold, await getGlobalMatchingThreshold());
      const result = scoreJobCandidate(jobForMatching, profile as unknown as Parameters<typeof scoreJobCandidate>[1]);

      if (!meetsThreshold(result, threshold).pass) {
        await recordAlertOutcome(db, key, {
          candidateEmail: email, jobId: job.id, jobVersion,
          score: result.overallScore, threshold, eligible: false,
          status: 'skipped', reason: meetsThreshold(result, threshold).reason,
        });
        skipped++;
        continue;
      }

      // Atomic dedup claim: only this worker may send for this (candidate,job,version).
      const claimSend = await claimSendSlot(db, key, { candidateEmail: email, jobId: job.id, jobVersion, score: result.overallScore, threshold });
      if (!claimSend.claimed) { skipped++; continue; }

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
          candidateEmail: email, jobId: job.id, jobVersion,
          score: result.overallScore, threshold, eligible: true,
          status: 'sent', deliveredAt: Timestamp.now(), messageId: outcome.messageId || null,
        });
        sent++;
      } else {
        await recordAlertOutcome(db, key, {
          candidateEmail: email, jobId: job.id, jobVersion,
          score: result.overallScore, threshold, eligible: true,
          status: 'failed', failureReason: redactReason(outcome.detail || 'send-failed'),
        });
        failed++;
      }
    }
    if (batchSnap.size < candidateBatchSize) { allDone = true; break; }
  }

  // Finalize: 'processed' if all candidates done, else 'pending' (partial) with cursor.
  if (allDone) {
    const status = failed > 0 && sent === 0 ? 'failed' : 'processed';
    await setEventStatus(db, eventDocId, {
      status,
      processedAt: Timestamp.now(),
      claimedAt: null,
      lastCandidateId: null,
      stats: cum(),
    });
    return { eventId: eventDocId, status, candidatesEvaluated: evaluated, alertsSent: sent, alertsSkipped: skipped, alertsFailed: failed };
  }
  // Partial: send cap hit before all candidates evaluated. Stay pending + cursor.
  // Store CUMULATIVE stats (startStats + this run's deltas) so the event's totals
  // stay correct across multiple partial drains; the RETURN is per-call deltas.
  await setEventStatus(db, eventDocId, {
    status: 'pending',
    claimedAt: null,
    lastCandidateId: cursor,
    stats: cum(),
  });
  return { eventId: eventDocId, status: 'pending', partial: true, candidatesEvaluated: evaluated, alertsSent: sent, alertsSkipped: skipped, alertsFailed: failed };
}

/**
 * Atomically claim the send slot for a (candidate,job,version). Sets the
 * jobAlertsSent doc to 'sending' only if it is not already 'sent'/'sending'.
 * Returns {claimed:true} if this caller may send; {claimed:false} if a
 * concurrent worker already delivered or is in flight.
 */
async function claimSendSlot(
  db: JobAlertDataStore,
  key: string,
  meta: { candidateEmail: string; jobId: string; jobVersion: number; score: number; threshold: number }
): Promise<{ claimed: boolean }> {
  try {
    return await db.runTransaction(async (tx) => {
      const ref = db.collection(JOB_ALERTS_SENT_COLLECTION).doc(key);
      const snap = (await tx.get(ref)) as { exists: boolean; data: () => Record<string, unknown> | undefined };
      if (snap.exists) {
        const data = (snap.data() || {}) as Record<string, unknown>;
        const st = String(data.status || '');
        if (st === 'sent' || st === 'sending') return { claimed: false };
        tx.update(ref, { status: 'sending', claimedAt: Timestamp.now(), candidateEmail: meta.candidateEmail, jobId: meta.jobId, jobVersion: meta.jobVersion, score: meta.score, threshold: meta.threshold });
        return { claimed: true };
      }
      tx.set(ref, { status: 'sending', claimedAt: Timestamp.now(), candidateEmail: meta.candidateEmail, jobId: meta.jobId, jobVersion: meta.jobVersion, score: meta.score, threshold: meta.threshold, dedupKey: key, createdAt: Timestamp.now(), attemptCount: 1 });
      return { claimed: true };
    });
  } catch {
    // If the transaction fails, fall back to non-claim (recordAlertOutcome still
    // prevents a duplicate 'sent' via alreadyDelivered semantics upstream). Fail
    // safe: prefer not to send over double-send.
    return { claimed: false };
  }
}

/**
 * Drain up to `maxEventsPerRun` pending events. Recovers stuck 'processing'
 * events first, then drains. Bounded so a single admin call cannot run
 * unbounded work. Partial (send-cap-hit) events remain pending for the next call.
 */
export async function processPendingJobMatchEvents(
  db: JobAlertDataStore,
  sendAlert: AlertSender,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome[]> {
  await recoverStuckEvents(db, opts.stuckTimeoutMs ?? DEFAULTS.stuckTimeoutMs);
  const maxEventsPerRun = opts.maxEventsPerRun ?? DEFAULTS.maxEventsPerRun;
  let snap: QuerySnap;
  try {
    snap = await db.collection(JOB_MATCH_EVENTS_COLLECTION).where('status', '==', 'pending').limit(maxEventsPerRun).get();
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
 * candidate against currently-published jobs only. Deduped via the same atomic
 * claimSendSlot — never re-sends an already-delivered alert. OFF by default; an
 * admin must trigger it explicitly.
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
  if (!resolveJobAlertPreference(profile.jobAlertPreference)) {
    return { ...empty, status: 'opted-out', reason: 'candidate has not opted in to job alerts' };
  }
  const threshold = resolveMatchingThreshold(profile.matchingThreshold);

  let jobsSnap: QuerySnap;
  try {
    jobsSnap = await db.collection('jobs').where('isActive', '==', true).limit(jobBatch).get();
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
    if (jdata.deletedAt) continue;
    const version = Math.max(1, Math.floor(Number(jdata.version) || 1));
    const key = dedupKey(email, jdoc.id, version);
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
    const claimSend = await claimSendSlot(db, key, { candidateEmail: email, jobId: jdoc.id, jobVersion: version, score: result.overallScore, threshold });
    if (!claimSend.claimed) { skipped++; continue; }
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
