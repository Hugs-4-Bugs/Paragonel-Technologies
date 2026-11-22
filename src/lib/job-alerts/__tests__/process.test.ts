/**
 * process.test.ts — bounded, idempotent job-match event processing
 * (Prompt 05R §8, §12 "Notifications").
 *
 * Covers: provider success, provider failure (never claimed as sent), below-
 * threshold skip, duplicate suppression (event-level + jobAlertsSent-level),
 * inactive/deleted job -> cancelled, bounded batches, opted-out candidate ->
 * no alert, retry-after-failure.
 *
 * Uses the in-memory fake-firestore (no emulator) + an injected mock sender.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { FakeFirestore } from '@/lib/auth/__tests__/fake-firestore';
import { processJobMatchEvent, type JobAlertDataStore, type AlertSender } from '../process';
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
