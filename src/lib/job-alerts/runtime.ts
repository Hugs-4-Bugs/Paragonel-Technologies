/**
 * runtime.ts — bridges the Admin SDK Firestore + the real email sender to the
 * idempotent job-alert processor. Used by /api/admin/jobs/** and the
 * backfill/drain endpoints so they do not duplicate the wiring logic.
 *
 * The Admin `Firestore` object structurally satisfies JobAlertDataStore
 * (collection().doc().get/set/update + collection().where().limit().get()).
 */
import type { Firestore } from 'firebase-admin/firestore';
import { enqueueJobMatchEvent, type JobMatchTriggerKind } from './trigger';
import { eventId } from './dedup';
import { scheduleContinuation } from './continuation';
import {
  processJobMatchEvent,
  processPendingJobMatchEvents,
  backfillCandidate,
  type JobAlertDataStore,
  type AlertSender,
  type ProcessOptions,
  type ProcessOutcome,
} from './process';
import { sendJobMatchAlert } from '@/lib/email';

/** Cast the Admin Firestore to the structural store the processor uses. */
export function jobAlertStore(db: Firestore): JobAlertDataStore {
  return db as unknown as JobAlertDataStore;
}

/** The real email sender (nodemailer transport, SMTP/Mailpit/dev-unconfigured). */
export const realAlertSender: AlertSender = sendJobMatchAlert;

/**
 * Tight bounds for draining an event synchronously inside an admin publish
 * action (so the publish response stays fast). Remaining pending events are
 * drained by the dedicated /api/admin/jobs/process-match-events endpoint.
 */
export const PUBLISH_DRAIN_OPTS: ProcessOptions = {
  candidateBatchSize: 25,
  maxAlertsPerRun: 10,
  maxEventsPerRun: 5,
};

/**
 * Enqueue (idempotent) + process a single job-match event. Used by the admin
 * job create/activate/material-update routes so a genuine publish triggers
 * matching without a separate manual step (Prompt 05R §7: "Do not rely on a
 * visitor opening the Careers page"). Bounded by PUBLISH_DRAIN_OPTS.
 */
export async function enqueueAndProcessJobEvent(
  db: Firestore,
  input: { jobId: string; jobVersion: number; trigger: JobMatchTriggerKind },
  opts: ProcessOptions = PUBLISH_DRAIN_OPTS
): Promise<ProcessOutcome> {
  const store = jobAlertStore(db);
  await enqueueJobMatchEvent(store, input); // idempotent: no-op if already processed
  const outcome = await processJobMatchEvent(store, eventId(input.jobId, input.jobVersion), realAlertSender, opts);
  // Event-driven continuation (Prompt §7): if the inline drain left the event
  // partial (send cap hit, cursor persisted) or pending, schedule a background
  // continuation chain via Next.js after() — no cron, no paid scheduler. The
  // chain is idempotent (atomic claimEvent + claimSendSlot make redundant hops
  // safe) + bounded by MAX_CONTINUATION_HOPS + the token TTL. Requires
  // APP_BASE_URL; otherwise the admin manual-drain remains the backstop.
  if (outcome.partial || outcome.status === 'pending') {
    scheduleContinuation(0);
  }
  return outcome;
}

/** Drain pending events (admin endpoint). */
export async function drainPendingJobMatchEvents(
  db: Firestore,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome[]> {
  return processPendingJobMatchEvents(jobAlertStore(db), realAlertSender, opts);
}

/** Backfill a single candidate (admin endpoint, off by default). */
export async function backfillCandidateAlerts(
  db: Firestore,
  candidateEmail: string,
  opts: ProcessOptions = {}
): Promise<ProcessOutcome> {
  return backfillCandidate(jobAlertStore(db), candidateEmail, realAlertSender, opts);
}
