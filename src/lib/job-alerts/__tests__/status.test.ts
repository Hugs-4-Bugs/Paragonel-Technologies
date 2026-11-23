/**
 * status.test.ts — admin alert-status summarization (Batch 2 Task 3).
 *
 * Covers event by-status counts, stuck detection (processing past the stuck
 * timeout vs. recently claimed), redacted + capped recent failures, alert
 * outcome counts, and that the summary carries NO candidate PII (no emails,
 * no dedup keys, no per-candidate scores).
 */
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { summarizeAlertStatus } from '../status';

const NOW = Date.parse('2024-06-01T12:00:00.000Z');
const STUCK_MS = 5 * 60 * 1000;

function ev(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}
function al(data: Record<string, unknown>) {
  return { data: () => data };
}

describe('summarizeAlertStatus — events by status', () => {
  it('counts events per status', () => {
    const s = summarizeAlertStatus(
      [ev('e1', { status: 'pending' }), ev('e2', { status: 'processed' }), ev('e3', { status: 'pending' })],
      [],
      NOW,
      STUCK_MS,
    );
    expect(s.events.byStatus).toEqual({ pending: 2, processed: 1 });
    expect(s.events.total).toBe(3);
  });
  it('defaults a missing status to "pending"', () => {
    const s = summarizeAlertStatus([ev('e1', {})], [], NOW, STUCK_MS);
    expect(s.events.byStatus.pending).toBe(1);
  });
});

describe('summarizeAlertStatus — stuck detection', () => {
  it('flags a processing event whose claimedAt is older than the stuck timeout', () => {
    const oldClaimed = Timestamp.fromMillis(NOW - STUCK_MS - 60_000);
    const s = summarizeAlertStatus(
      [ev('e1', { status: 'processing', jobId: 'j1', claimedAt: oldClaimed, attempts: 2 })],
      [],
      NOW,
      STUCK_MS,
    );
    expect(s.events.stuck).toHaveLength(1);
    expect(s.events.stuck[0]).toMatchObject({ eventId: 'e1', jobId: 'j1', attempts: 2 });
    expect(s.events.stuck[0].claimedAt).toBe(new Date(NOW - STUCK_MS - 60_000).toISOString());
  });
  it('does NOT flag a processing event claimed within the stuck timeout', () => {
    const recentClaimed = Timestamp.fromMillis(NOW - 10_000);
    const s = summarizeAlertStatus(
      [ev('e1', { status: 'processing', jobId: 'j1', claimedAt: recentClaimed })],
      [],
      NOW,
      STUCK_MS,
    );
    expect(s.events.stuck).toHaveLength(0);
  });
  it('does NOT flag a non-processing event even if claimedAt is old', () => {
    const old = Timestamp.fromMillis(NOW - STUCK_MS - 60_000);
    const s = summarizeAlertStatus(
      [ev('e1', { status: 'processed', jobId: 'j1', claimedAt: old })],
      [],
      NOW,
      STUCK_MS,
    );
    expect(s.events.stuck).toHaveLength(0);
  });
});

describe('summarizeAlertStatus — recent failures (redacted + capped)', () => {
  it('includes events with a lastError, redacted', () => {
    const s = summarizeAlertStatus(
      [
        ev('e1', {
          status: 'pending',
          jobId: 'j1',
          lastError: 'smtp timeout: secretkey@host',
          attempts: 3,
        }),
      ],
      [],
      NOW,
      STUCK_MS,
    );
    expect(s.events.recentFailures).toHaveLength(1);
    expect(s.events.recentFailures[0].eventId).toBe('e1');
    // redactReason strips the credential in the URL.
    expect(s.events.recentFailures[0].lastError).not.toContain('secretkey');
  });
  it('caps recent failures at 10 (most-recent first by eventId)', () => {
    const docs = [];
    for (let i = 0; i < 15; i++) docs.push(ev(`e${i.toString().padStart(2, '0')}`, { lastError: 'err' }));
    const s = summarizeAlertStatus(docs, [], NOW, STUCK_MS);
    expect(s.events.recentFailures).toHaveLength(10);
    // eventId desc → e14 first.
    expect(s.events.recentFailures[0].eventId).toBe('e14');
  });
});

describe('summarizeAlertStatus — alerts by status', () => {
  it('counts alert outcomes', () => {
    const s = summarizeAlertStatus(
      [],
      [al({ status: 'sent' }), al({ status: 'sent' }), al({ status: 'failed' }), al({ status: 'skipped' })],
      NOW,
      STUCK_MS,
    );
    expect(s.alerts.byStatus).toEqual({ sent: 2, failed: 1, skipped: 1 });
    expect(s.alerts.total).toBe(4);
  });
});

describe('summarizeAlertStatus — privacy (no candidate PII)', () => {
  it('never surfaces candidate emails, dedup keys, or per-candidate scores', () => {
    // An alert doc carries a dedup key (encodes email+job+version) + score; an
    // event may carry a lastCandidateId. None of these may appear in the
    // summary.
    const s = summarizeAlertStatus(
      [
        ev('e1', {
          status: 'processed',
          jobId: 'j1',
          lastCandidateId: 'candidate@secret.com',
          lastError: 'boom',
        }),
      ],
      [
        al({ status: 'sent', dedupKey: 'candidate@secret.com__j1__v1', score: 92, threshold: 80 }),
      ],
      NOW,
      STUCK_MS,
    );
    const json = JSON.stringify(s);
    expect(json).not.toContain('candidate@secret.com');
    expect(json).not.toContain('dedupKey');
    expect(json).not.toContain('"score"');
    expect(json).not.toContain('92');
  });
});

/**
 * Consumer contract (Batch 4 Task 1): the /admin/alerts UI renders exactly the
 * fields summarizeAlertStatus returns. This locks the shape so a future change
 * to the summary that breaks the admin UI fails here. Every field the page
 * reads (events.byStatus, events.total, events.stuck[].{eventId,jobId,
 * claimedAt,attempts}, events.recentFailures[].{eventId,jobId,lastError,
 * attempts}, alerts.byStatus, alerts.total, generatedAt) must be present with
 * the expected types for a representative input.
 */
describe('summarizeAlertStatus — admin alerts UI consumer contract', () => {
  it('returns every field the /admin/alerts page renders, with correct types', () => {
    const stuckClaimed = Timestamp.fromMillis(NOW - STUCK_MS - 60_000);
    const s = summarizeAlertStatus(
      [
        ev('e-stuck', { status: 'processing', jobId: 'j-stuck', claimedAt: stuckClaimed, attempts: 2 }),
        ev('e-fail', { status: 'failed', jobId: 'j-fail', lastError: 'smtp timeout: secret@host', attempts: 3 }),
        ev('e-ok', { status: 'processed', jobId: 'j-ok' }),
      ],
      [
        al({ status: 'sent' }),
        al({ status: 'skipped' }),
      ],
      NOW,
      STUCK_MS,
    );

    // Top-level shape.
    expect(typeof s.generatedAt).toBe('string');
    expect(new Date(s.generatedAt).toISOString()).toBe(s.generatedAt);

    // events block.
    expect(s.events.total).toBe(3);
    expect(s.events.byStatus).toEqual({ processing: 1, failed: 1, processed: 1 });

    // stuck: one entry, all four UI fields present + correctly typed.
    expect(s.events.stuck).toHaveLength(1);
    const stuck = s.events.stuck[0];
    expect(stuck.eventId).toBe('e-stuck');
    expect(stuck.jobId).toBe('j-stuck');
    expect(typeof stuck.claimedAt).toBe('string');
    expect(stuck.attempts).toBe(2);

    // recentFailures: one entry, all four UI fields present + redacted.
    expect(s.events.recentFailures).toHaveLength(1);
    const fail = s.events.recentFailures[0];
    expect(fail.eventId).toBe('e-fail');
    expect(fail.jobId).toBe('j-fail');
    expect(typeof fail.lastError).toBe('string');
    expect(fail.lastError).not.toContain('secret');
    expect(fail.attempts).toBe(3);

    // alerts block.
    expect(s.alerts.total).toBe(2);
    expect(s.alerts.byStatus).toEqual({ sent: 1, skipped: 1 });
  });

  it('returns stable empty structures (not undefined) when there is no data', () => {
    const s = summarizeAlertStatus([], [], NOW, STUCK_MS);
    // The UI maps over byStatus keys + stuck + recentFailures — these must be
    // arrays/objects, never undefined, or the page throws on empty state.
    expect(s.events.byStatus).toEqual({});
    expect(Array.isArray(s.events.stuck)).toBe(true);
    expect(s.events.stuck).toHaveLength(0);
    expect(Array.isArray(s.events.recentFailures)).toBe(true);
    expect(s.events.recentFailures).toHaveLength(0);
    expect(s.events.total).toBe(0);
    expect(s.alerts.byStatus).toEqual({});
    expect(s.alerts.total).toBe(0);
  });
});
