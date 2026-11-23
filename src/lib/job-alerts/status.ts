/**
 * status.ts — pure summarization of job-match alert-processing state (Batch 2
 * Task 3). Extracted from the route so it is unit-testable with synthetic
 * fixtures (no emulator).
 *
 * Produces an admin-facing snapshot of `jobMatchEvents` + `jobAlertsSent`:
 *   - events: counts by status (pending/processing/processed/cancelled), the
 *     stuck set (status 'processing' whose `claimedAt` is older than the stuck
 *     timeout), and the most-recent failures (redacted `lastError`).
 *   - alerts: counts by outcome (sent/skipped/failed).
 *
 * PRIVACY: the summary carries NO candidate PII — no emails, no dedup keys
 * (which encode email+job+version), no resume paths, no per-candidate scores.
 * Only aggregate counts + event ids + job ids + a redacted `lastError` are
 * returned. `redactReason` strips credentials/tokens from any failure text.
 */
import { redactReason } from './dedup';

export interface AlertStatusSummary {
  events: {
    byStatus: Record<string, number>;
    total: number;
    stuck: { eventId: string; jobId: string; claimedAt: string | null; attempts: number }[];
    recentFailures: { eventId: string; jobId: string; lastError: string; attempts: number }[];
  };
  alerts: {
    byStatus: Record<string, number>;
    total: number;
  };
  generatedAt: string;
}

/** Minimal doc shape the summarizer needs (works with Firestore snapshots + fakes). */
interface DocLike {
  id?: string;
  data: () => Record<string, unknown>;
}

function toMillis(v: unknown): number {
  try {
    if (v instanceof Date) return v.getTime();
    if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
      return (v as { toMillis: () => number }).toMillis();
    }
    if (typeof v === 'number') return v;
  } catch {
    return 0;
  }
  return 0;
}

function toISO(v: unknown): string | null {
  const ms = toMillis(v);
  return ms ? new Date(ms).toISOString() : null;
}

const MAX_RECENT_FAILURES = 10;

export function summarizeAlertStatus(
  eventDocs: DocLike[],
  alertDocs: DocLike[],
  now: number = Date.now(),
  stuckTimeoutMs: number = 5 * 60 * 1000,
): AlertStatusSummary {
  const byStatus: Record<string, number> = {};
  const stuck: AlertStatusSummary['events']['stuck'] = [];
  const failures: AlertStatusSummary['events']['recentFailures'] = [];

  for (const d of eventDocs) {
    const ev = d.data();
    const status = String(ev.status ?? 'pending');
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    if (status === 'processing') {
      const claimed = toMillis(ev.claimedAt);
      if (claimed && now - claimed > stuckTimeoutMs) {
        stuck.push({
          eventId: String(d.id ?? ev.eventId ?? ''),
          jobId: String(ev.jobId ?? ''),
          claimedAt: toISO(ev.claimedAt),
          attempts: Number(ev.attempts ?? 0),
        });
      }
    }

    const lastError = ev.lastError;
    if (lastError) {
      failures.push({
        eventId: String(d.id ?? ev.eventId ?? ''),
        jobId: String(ev.jobId ?? ''),
        lastError: redactReason(lastError),
        attempts: Number(ev.attempts ?? 0),
      });
    }
  }

  // Most-recent failures first (by eventId desc as a stable proxy) + capped.
  failures.sort((a, b) => (a.eventId > b.eventId ? -1 : a.eventId < b.eventId ? 1 : 0));
  const recentFailures = failures.slice(0, MAX_RECENT_FAILURES);

  const alertByStatus: Record<string, number> = {};
  for (const d of alertDocs) {
    const a = d.data();
    const s = String(a.status ?? 'unknown');
    alertByStatus[s] = (alertByStatus[s] ?? 0) + 1;
  }

  return {
    events: { byStatus, total: eventDocs.length, stuck, recentFailures },
    alerts: { byStatus: alertByStatus, total: alertDocs.length },
    generatedAt: new Date(now).toISOString(),
  };
}
