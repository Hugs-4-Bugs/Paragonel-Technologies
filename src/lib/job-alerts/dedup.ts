/**
 * dedup.ts — deduplication keys + collection names for job-match alerts
 * (Prompt 05R §7 idempotency, §8 duplicate suppression).
 *
 * The dedup key binds a (candidate, job, job-version) triple. Because the job
 * version only advances on a material change or a draft->active transition, the
 * same key can never represent two different notification-worthy states of the
 * same job. This is what makes retries safe: re-running a processed event finds
 * the existing `jobAlertsSent` record with status 'sent' and skips, so a retry
 * can never produce a duplicate successful delivery (Prompt 05R §8).
 */

/** Firestore collection holding one notification outcome per (candidate,job,version). */
export const JOB_ALERTS_SENT_COLLECTION = 'jobAlertsSent';
/** Firestore collection holding one durable trigger event per (job,version). */
export const JOB_MATCH_EVENTS_COLLECTION = 'jobMatchEvents';

/**
 * Build the dedup key for a candidate/job/version triple. All inputs are
 * lowercased + trimmed so the same logical notification always maps to the same
 * doc id regardless of input casing.
 */
export function dedupKey(candidateEmail: string, jobFirestoreId: string, jobVersion: number): string {
  const e = (candidateEmail || '').trim().toLowerCase();
  const j = (jobFirestoreId || '').trim();
  const v = Math.max(1, Math.floor(Number(jobVersion) || 1));
  return `${e}__${j}__v${v}`;
}

/**
 * Build the event id for a (job,version) pair. Stable so re-enqueuing the same
 * published version is a no-op (idempotent).
 */
export function eventId(jobFirestoreId: string, jobVersion: number): string {
  const j = (jobFirestoreId || '').trim();
  const v = Math.max(1, Math.floor(Number(jobVersion) || 1));
  return `${j}__v${v}`;
}

/** Safely redact a failure reason so no credentials/PII leak into stored logs or
 * the admin alert-status summary (recentFailures.lastError). Redacts URL
 * credentials, bare email addresses, and common API-key / token prefixes
 * (OpenAI sk-, Firebase AIza, GitHub ghp_/github_pat_, Slack xox, Bearer). */
export function redactReason(reason: unknown): string {
  if (!reason) return 'unknown';
  const s = reason instanceof Error ? reason.message : String(reason);
  return s
    // 1. URL credentials: scheme://user:pass@host → user:***@host.
    .replace(/:[^:@/]+@/g, ':***@')
    // 2. Bare email addresses → [REDACTED] (no candidate PII in stored logs).
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[REDACTED]')
    // 3. Common API-key / token prefixes + Bearer tokens → [REDACTED].
    .replace(
      /(?:sk-|sk_live_|pk_live_|AIza|ghp_|gho_|ghs_|github_pat_|xox[bpoa]-|Bearer\s+)[A-Za-z0-9_.-]{6,}/g,
      '[REDACTED]',
    )
    .slice(0, 160);
}
