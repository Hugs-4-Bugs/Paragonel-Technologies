/**
 * process.test.ts — bounded, idempotent job-match event processing
 * (Prompt 05R §8, §12 "Notifications"; 05S §6 concurrency/pagination).
 *
 * Covers: provider success, provider failure (never claimed as sent), below-
 * threshold skip, duplicate suppression (event-level + jobAlertsSent-level),
 * inactive/deleted job -> cancelled, bounded batches, opted-out candidate ->
 * no alert, retry-after-failure.
 *
 * 05S additions: concurrent same-event processing (atomic claim), stuck-
 * processing recovery, candidate pagination across drain calls (beyond the
 * first batch), atomic dedup under concurrent workers (no duplicate send).
 *
 * Uses the in-memory fake-firestore (no emulator; serialized transactions) +
 * an injected mock sender.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { FakeFirestore } from '@/lib/auth/__tests__/fake-firestore';
import { processJobMatchEvent, recoverStuckEvents, type JobAlertDataStore, type AlertSender } from '../process';
import { eventId, dedupKey, JOB_ALERTS_SENT_COLLECTION } from '../dedup';

function makeStore(): JobAlertDataStore {
  return new FakeFirestore() as unknown as JobAlertDataStore;
}

async function seedJob(db: JobAlertDataStore, id: string, over: Record<string, unknown> = {}): Promise<void> {
  await db.collection('jobs').doc(id).set({
    isActive: true,
    deletedAt: null,
    jobId: id,
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '2 years',
    skills: ['React'],
    version: 1,
    ...over,
  });
}
async function seedEvent(db: JobAlertDataStore, jobId: string, version = 1, status = 'pending'): Promise<void> {
  await db.collection('jobMatchEvents').doc(eventId(jobId, version)).set({
    jobId,
    jobVersion: version,
    trigger: 'create',
    status,
    attempts: 0,
    stats: { candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 },
    createdAt: Timestamp.now(),
  });
}
async function seedCandidate(db: JobAlertDataStore, email: string, over: Record<string, unknown> = {}): Promise<void> {
  await db.collection('candidates').doc(email).set({
    email,
    jobAlertPreference: true,
    matchingThreshold: 80,
    skills: ['React'],
    techStack: [],
    totalExperienceYears: 3,
    preferredEmploymentType: 'full-time',
    workModePreference: 'remote',
    currentLocation: 'Anywhere',
    ...over,
  });
}

function mockSender(result: { status: 'sent' | 'skipped' | 'failed'; detail?: string; messageId?: string }): { sender: AlertSender; calls: { to: string }[] } {
  const calls: { to: string }[] = [];
  const sender: AlertSender = async (input) => {
    calls.push({ to: input.to });
    return result;
  };
  return { sender, calls };
}

async function sentRecord(db: JobAlertDataStore, email: string, jobId: string, version = 1): Promise<Record<string, unknown> | undefined> {
  const snap = await db.collection(JOB_ALERTS_SENT_COLLECTION).doc(dedupKey(email, jobId, version)).get();
  return snap.data();
}

describe('processJobMatchEvent (Prompt 05R §8)', () => {
  let db: JobAlertDataStore;
  beforeEach(() => { db = makeStore(); });

  it('provider success -> records "sent", event "processed", sender called once', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'sent', messageId: 'mid-1' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });

    expect(out.status).toBe('processed');
    expect(out.alertsSent).toBe(1);
    expect(calls.length).toBe(1);
    expect(calls[0].to).toBe('jane@example.com');
    const rec = await sentRecord(db, 'jane@example.com', 'job1');
    expect(rec?.status).toBe('sent');
    expect(rec?.eligible).toBe(true);
    expect(rec?.messageId).toBe('mid-1');
  });

  it('provider FAILURE -> records "failed" (NEVER claims success), alertsFailed=1', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'failed', detail: 'smtp-rejected' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });

    expect(out.alertsSent).toBe(0);
    expect(out.alertsFailed).toBe(1);
    expect(calls.length).toBe(1);
    const rec = await sentRecord(db, 'jane@example.com', 'job1');
    expect(rec?.status).toBe('failed');
    expect(String(rec?.failureReason)).toContain('smtp-rejected');
  });

  it('below threshold (no required skills) -> records "skipped", no email', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com', { skills: ['Java'] }); // none of required ['React']
    const { sender, calls } = mockSender({ status: 'sent' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });

    expect(out.alertsSent).toBe(0);
    expect(out.alertsSkipped).toBe(1);
    expect(calls.length).toBe(0);
    const rec = await sentRecord(db, 'jane@example.com', 'job1');
    expect(rec?.status).toBe('skipped');
    expect(rec?.eligible).toBe(false);
  });

  it('duplicate suppression: re-running a processed event does not re-send', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'sent' });

    await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(calls.length).toBe(1);
    // Second run: event is now 'processed' -> short-circuits, no sender call.
    const out2 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(out2.status).toBe('processed');
    expect(calls.length).toBe(1); // unchanged
  });

  it('dedup-level: re-arming a failed/pending event after a sent record skips the candidate', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'sent' });

    await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(calls.length).toBe(1);
    // Re-arm the event (simulate a retry) and run again. The candidate already
    // has a 'sent' record -> alreadyDelivered -> skipped, no second email.
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({ status: 'pending' });
    const out2 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(out2.alertsSkipped).toBeGreaterThanOrEqual(1);
    expect(out2.alertsSent).toBe(0);
    expect(calls.length).toBe(1); // still one delivery total
  });

  it('inactive job -> event "cancelled", no alerts', async () => {
    await seedJob(db, 'job1', { isActive: false });
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'sent' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(out.cancelled).toBe(true);
    expect(out.alertsSent).toBe(0);
    expect(calls.length).toBe(0);
  });

  it('deleted job -> event "cancelled", no alerts', async () => {
    await seedJob(db, 'job1', { deletedAt: Timestamp.now() });
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    const { sender, calls } = mockSender({ status: 'sent' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(out.cancelled).toBe(true);
    expect(calls.length).toBe(0);
  });

  it('bounded batches: caps sends at maxAlertsPerRun', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'a@example.com');
    await seedCandidate(db, 'b@example.com');
    await seedCandidate(db, 'c@example.com');
    const { sender, calls } = mockSender({ status: 'sent' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 50, maxAlertsPerRun: 2 });
    expect(out.alertsSent).toBe(2);
    expect(calls.length).toBe(2);
  });

  it('opted-out candidate (jobAlertPreference false) -> not evaluated, no alert', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com', { jobAlertPreference: false });
    const { sender, calls } = mockSender({ status: 'sent' });

    const out = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(out.candidatesEvaluated).toBe(0);
    expect(out.alertsSent).toBe(0);
    expect(calls.length).toBe(0);
  });

  it('retry after failure: a previously-failed record is retried and on success becomes "sent"', async () => {
    await seedJob(db, 'job1');
    await seedEvent(db, 'job1');
    await seedCandidate(db, 'jane@example.com');
    // First attempt: provider fails.
    const failSender = mockSender({ status: 'failed', detail: 'timeout' });
    await processJobMatchEvent(db, eventId('job1', 1), failSender.sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    let rec = await sentRecord(db, 'jane@example.com', 'job1');
    expect(rec?.status).toBe('failed');
    const attemptsAfterFail = Number(rec?.attemptCount);
    // Re-arm + retry: provider succeeds.
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({ status: 'pending' });
    const okSender = mockSender({ status: 'sent', messageId: 'mid-2' });
    await processJobMatchEvent(db, eventId('job1', 1), okSender.sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    rec = await sentRecord(db, 'jane@example.com', 'job1');
    expect(rec?.status).toBe('sent');
    expect(Number(rec?.attemptCount)).toBeGreaterThan(attemptsAfterFail);
  });
});

describe('processJobMatchEvent — 05S §6 concurrency + pagination', () => {
  async function seedMatchable(db: JobAlertDataStore, nCandidates: number): Promise<void> {
    await db.collection('jobs').doc('job1').set({
      isActive: true, deletedAt: null, jobId: 'job1', title: 'Dev', department: 'Engineering',
      location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote',
      experienceRequired: '2 years', skills: ['React'], version: 1,
    });
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).set({
      jobId: 'job1', jobVersion: 1, trigger: 'create', status: 'pending', attempts: 0,
      stats: { candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 },
      createdAt: Timestamp.now(),
    });
    const letters = ['a', 'b', 'c', 'd', 'e'];
    for (let i = 0; i < nCandidates; i++) {
      const email = `${letters[i]}@example.com`;
      await db.collection('candidates').doc(email).set({
        email, jobAlertPreference: true, matchingThreshold: 80,
        skills: ['React'], totalExperienceYears: 3,
        preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Anywhere',
      });
    }
  }

  it('concurrent same-event: only ONE worker sends (atomic claim)', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    const calls: { to: string }[] = [];
    const sender: AlertSender = async (input) => {
      calls.push({ to: input.to });
      // simulate a little async work so the two calls actually overlap
      await new Promise((r) => setTimeout(r, 5));
      return { status: 'sent', messageId: 'm' };
    };
    // Two concurrent drains of the SAME event.
    const [r1, r2] = await Promise.all([
      processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 }),
      processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 }),
    ]);
    // Exactly one worker claimed + sent; the other saw 'processing' and skipped.
    expect(calls.length).toBe(1);
    const sending = [r1, r2].find((o) => o.status === 'processed' || o.status === 'pending');
    const inflight = [r1, r2].find((o) => o.status === 'processing');
    expect(sending).toBeTruthy();
    expect(inflight).toBeTruthy();
  });

  it('candidate pagination across drain calls (beyond the first batch)', async () => {
    const db = makeStore();
    // 3 matching candidates, batch 2, send-cap 2 per call -> first call sends 2
    // (partial, pending, cursor), second call resumes + sends the 3rd.
    await seedMatchable(db, 3);
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };

    const r1 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 2, maxAlertsPerRun: 2 });
    expect(r1.alertsSent).toBe(2);
    expect(r1.partial).toBe(true);
    expect(r1.status).toBe('pending');

    const r2 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 2, maxAlertsPerRun: 2 });
    expect(r2.alertsSent).toBe(1);
    expect(r2.status).toBe('processed');

    // All 3 distinct candidates were sent exactly once (no duplicates).
    expect(calls.length).toBe(3);
    expect(new Set(calls).size).toBe(3);
  });

  it('a single drain with a large send cap evaluates ALL candidates (internal pagination)', async () => {
    const db = makeStore();
    await seedMatchable(db, 3);
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    // batch 2 but send-cap 10 -> the single call pages through both batches.
    const r = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 2, maxAlertsPerRun: 10 });
    expect(r.status).toBe('processed');
    expect(r.alertsSent).toBe(3);
    expect(calls.length).toBe(3);
  });

  it('recoverStuckEvents re-arms an event stuck in processing past the timeout', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    // Simulate a worker that claimed then crashed: status 'processing' with an old claimedAt.
    const stale = Timestamp.fromMillis(Date.now() - 10 * 60 * 1000); // 10 min ago
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({
      status: 'processing', claimedAt: stale,
    });
    const recovered = await recoverStuckEvents(db, 5 * 60 * 1000);
    expect(recovered).toBe(1);
    const ev = (await db.collection('jobMatchEvents').doc(eventId('job1', 1)).get()).data();
    expect(String(ev?.status)).toBe('pending');

    // Now a normal drain processes it.
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    const r = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(r.status).toBe('processed');
    expect(calls.length).toBe(1);
  });

  it('recoverStuckEvents leaves a recently-claimed event alone', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    const fresh = Timestamp.fromMillis(Date.now() - 1000); // 1s ago
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({ status: 'processing', claimedAt: fresh });
    const recovered = await recoverStuckEvents(db, 5 * 60 * 1000);
    expect(recovered).toBe(0);
    const ev = (await db.collection('jobMatchEvents').doc(eventId('job1', 1)).get()).data();
    expect(String(ev?.status)).toBe('processing');
  });

  it('atomic dedup: a candidate already delivered is never re-sent, even mid-batch', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    // Pre-seed a 'sent' outcome for the candidate.
    const email = 'a@example.com';
    await db.collection(JOB_ALERTS_SENT_COLLECTION).doc(dedupKey(email, 'job1', 1)).set({
      candidateEmail: email, jobId: 'job1', jobVersion: 1, status: 'sent',
      attemptCount: 1, dedupKey: dedupKey(email, 'job1', 1), createdAt: Timestamp.now(),
    });
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    const r = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(r.alertsSent).toBe(0);
    expect(r.alertsSkipped).toBe(1);
    expect(calls.length).toBe(0); // never re-sent
  });

  it('cumulative STORED stats stay correct across multiple partial drains (regression)', async () => {
    const db = makeStore();
    // 5 matching candidates, send-cap 2 -> 3 drains (2 + 2 + 1).
    await seedMatchable(db, 5);
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    const opts = { candidateBatchSize: 2, maxAlertsPerRun: 2 };
    const r1 = await processJobMatchEvent(db, eventId('job1', 1), sender, opts);
    const r2 = await processJobMatchEvent(db, eventId('job1', 1), sender, opts);
    const r3 = await processJobMatchEvent(db, eventId('job1', 1), sender, opts);
    // Per-call returns: 2, 2, 1.
    expect([r1.alertsSent, r2.alertsSent, r3.alertsSent]).toEqual([2, 2, 1]);
    expect(r3.status).toBe('processed');
    // STORED cumulative stats must be 5/5 (the 05S bug stored per-call deltas,
    // so after run 2 the stored totals collapsed to 2 instead of 4).
    const ev = (await db.collection('jobMatchEvents').doc(eventId('job1', 1)).get()).data() as { stats?: { candidatesEvaluated?: number; alertsSent?: number } } | undefined;
    expect(Number(ev?.stats?.candidatesEvaluated)).toBe(5);
    expect(Number(ev?.stats?.alertsSent)).toBe(5);
    // No duplicate sends.
    expect(calls.length).toBe(5);
    expect(new Set(calls).size).toBe(5);
  });

  it('a candidate mid-send (status sending) is NEVER re-sent — no duplicate under crash', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    const email = 'a@example.com';
    // Simulate a worker that claimed the send slot then crashed: doc stuck 'sending'.
    await db.collection(JOB_ALERTS_SENT_COLLECTION).doc(dedupKey(email, 'job1', 1)).set({
      candidateEmail: email, jobId: 'job1', jobVersion: 1, status: 'sending',
      claimedAt: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000), // stale
      attemptCount: 1, dedupKey: dedupKey(email, 'job1', 1), createdAt: Timestamp.now(),
    });
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    const r = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    // The candidate is skipped (in-flight), never re-sent — at-most-once, no duplicate.
    expect(r.alertsSent).toBe(0);
    expect(r.alertsSkipped).toBe(1);
    expect(calls.length).toBe(0);
  });

  it('safe retry: a previously-FAILED send is retried and succeeds on the next drain', async () => {
    const db = makeStore();
    await seedMatchable(db, 1);
    const email = 'a@example.com';
    let attempt = 0;
    const sender: AlertSender = async (input) => {
      attempt++;
      if (attempt === 1) return { status: 'failed', detail: 'transient smtp timeout' };
      return { status: 'sent', messageId: 'm-' + input.to };
    };
    // First drain: send fails -> jobAlertsSent 'failed', event 'failed' (sent===0, failed>0).
    const r1 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(r1.alertsSent).toBe(0);
    expect(r1.alertsFailed).toBe(1);
    expect(r1.status).toBe('failed');
    // Admin re-arms the event for retry.
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({ status: 'pending', lastCandidateId: null });
    // Second drain: re-claims the 'failed' jobAlertsSent doc, retries, succeeds.
    const r2 = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(r2.alertsSent).toBe(1);
    expect(r2.status).toBe('processed');
    const rec = (await db.collection(JOB_ALERTS_SENT_COLLECTION).doc(dedupKey(email, 'job1', 1)).get()).data() as { status?: string; attemptCount?: number } | undefined;
    expect(String(rec?.status)).toBe('sent');
    expect(Number(rec?.attemptCount)).toBeGreaterThanOrEqual(2);
  });

  it('concurrent workers on the same multi-candidate event: every candidate sent exactly once', async () => {
    const db = makeStore();
    await seedMatchable(db, 4);
    const calls: string[] = [];
    const sender: AlertSender = async (input) => {
      calls.push(input.to);
      await new Promise((r) => setTimeout(r, 5));
      return { status: 'sent', messageId: 'm' };
    };
    // Two concurrent drains of the same event.
    await Promise.all([
      processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 }),
      processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 }),
    ]);
    // 4 candidates, each sent exactly once (no duplicates) despite concurrency.
    expect(calls.length).toBe(4);
    expect(new Set(calls).size).toBe(4);
  });

  it('crash-recovery: a worker that claimed the event but never finalized is recovered + completed', async () => {
    const db = makeStore();
    await seedMatchable(db, 2);
    // Simulate a crash: event stuck 'processing' with a stale claimedAt.
    await db.collection('jobMatchEvents').doc(eventId('job1', 1)).update({
      status: 'processing', claimedAt: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000),
    });
    // recoverStuckEvents re-arms it.
    const recovered = await recoverStuckEvents(db, 5 * 60 * 1000);
    expect(recovered).toBe(1);
    // A normal drain now processes it fully.
    const calls: string[] = [];
    const sender: AlertSender = async (input) => { calls.push(input.to); return { status: 'sent', messageId: 'm' }; };
    const r = await processJobMatchEvent(db, eventId('job1', 1), sender, { candidateBatchSize: 10, maxAlertsPerRun: 10 });
    expect(r.status).toBe('processed');
    expect(r.alertsSent).toBe(2);
    expect(calls.length).toBe(2);
  });
});
