/**
 * dedup.test.ts — dedup keys, event ids, redaction (Prompt 05R §7, §8).
 */
import { describe, it, expect } from 'vitest';
import { dedupKey, eventId, redactReason, JOB_ALERTS_SENT_COLLECTION, JOB_MATCH_EVENTS_COLLECTION } from '../dedup';

describe('dedup (Prompt 05R §7/§8)', () => {
  it('dedupKey binds candidate+job+version (email lowercased; job id preserved)', () => {
    // The candidate email is lowercased (emails are case-insensitive); the job
    // Firestore doc id is preserved exactly (doc ids are case-sensitive, so two
    // distinct ids must never collide in the dedup key).
    expect(dedupKey('Jane@Example.com', 'jobABC', 1)).toBe('jane@example.com__jobABC__v1');
    expect(dedupKey('Jane@Example.com', 'jobABC', 1)).toBe(dedupKey('jane@example.com', 'jobABC', 1));
  });
  it('dedupKey differs across versions (so a material change can re-notify)', () => {
    expect(dedupKey('a@b.com', 'j', 1)).not.toBe(dedupKey('a@b.com', 'j', 2));
  });
  it('dedupKey floors bad versions to 1', () => {
    expect(dedupKey('a@b.com', 'j', NaN)).toBe('a@b.com__j__v1');
    expect(dedupKey('a@b.com', 'j', 0)).toBe('a@b.com__j__v1');
  });
  it('eventId is stable per (job,version)', () => {
    expect(eventId('jobA', 1)).toBe('jobA__v1');
    expect(eventId('jobA', 1)).toBe(eventId('jobA', 1));
    expect(eventId('jobA', 1)).not.toBe(eventId('jobA', 2));
  });
  it('redactReason strips credentials from URLs', () => {
    const r = redactReason('connect error to smtp://user:secretpass@mail.host:587');
    expect(r).not.toContain('secretpass');
    expect(r).toContain('***@');
  });
  it('redactReason truncates long reasons', () => {
    expect(redactReason('x'.repeat(500)).length).toBeLessThanOrEqual(160);
  });
  it('collection names are stable', () => {
    expect(JOB_ALERTS_SENT_COLLECTION).toBe('jobAlertsSent');
    expect(JOB_MATCH_EVENTS_COLLECTION).toBe('jobMatchEvents');
  });
});
