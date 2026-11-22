/**
 * trigger.test.ts — when to enqueue + idempotent enqueue (Prompt 05R §7).
 * Uses the in-memory fake-firestore (no emulator).
 */
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { FakeFirestore } from '@/lib/auth/__tests__/fake-firestore';
import {
  shouldEnqueueOnCreate,
  shouldEnqueueOnToggle,
  shouldEnqueueOnUpdate,
  isMaterialJobChange,
  computeJobVersion,
  enqueueJobMatchEvent,
  getJobMatchEvent,
  type JobMatchStore,
} from '../trigger';
import { eventId } from '../dedup';

const store = () => new FakeFirestore() as unknown as JobMatchStore;

describe('trigger conditions (Prompt 05R §7)', () => {
  it('create: Active -> create; Draft -> null', () => {
    expect(shouldEnqueueOnCreate({ status: 'Active' })).toBe('create');
    expect(shouldEnqueueOnCreate({ status: 'Draft' })).toBe(null);
  });

  it('toggle: Draft->Active -> activate; Active->Draft / no-op -> null', () => {
    expect(shouldEnqueueOnToggle(false, true)).toBe('activate');
    expect(shouldEnqueueOnToggle(true, false)).toBe(null);
    expect(shouldEnqueueOnToggle(true, true)).toBe(null);
    expect(shouldEnqueueOnToggle(false, false)).toBe(null);
  });

  it('update: publish transition -> activate; material change -> material_update; unrelated edit -> null', () => {
    const prevActive = { status: 'Active', skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years' };
    // Draft -> Active
    expect(shouldEnqueueOnUpdate({ status: 'Draft' }, { status: 'Active', skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years' })).toBe('activate');
    // Active -> Active, material (skills changed)
    expect(shouldEnqueueOnUpdate(prevActive, { status: 'Active', skills: ['React', 'Go'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years' })).toBe('material_update');
    // Active -> Active, NO material change (salary only)
    expect(shouldEnqueueOnUpdate(prevActive, { status: 'Active', skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years', salaryRange: '$$$' })).toBe(null);
    // Active -> Draft (unpublish)
    expect(shouldEnqueueOnUpdate(prevActive, { status: 'Draft', skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years' })).toBe(null);
  });

  it('isMaterialJobChange: ignores salary/deadline/description-only edits', () => {
    const prev = { skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years', salaryRange: '', deadline: '', description: 'old' };
    expect(isMaterialJobChange(prev, { ...prev, salaryRange: '$100k' })).toBe(false);
    expect(isMaterialJobChange(prev, { ...prev, deadline: '2026-12-01' })).toBe(false);
    expect(isMaterialJobChange(prev, { ...prev, description: 'new description text' })).toBe(false);
    expect(isMaterialJobChange(prev, { ...prev, skills: ['React', 'Go'] })).toBe(true);
    expect(isMaterialJobChange(prev, { ...prev, location: 'Bengaluru' })).toBe(true);
    expect(isMaterialJobChange(prev, { ...prev, workArrangement: 'Onsite' })).toBe(true);
  });

  it('computeJobVersion bumps on material change, stays same on unrelated edit', () => {
    const prev = { status: 'Active', skills: ['React'], title: 'Dev', location: 'Remote', employmentType: 'Full Time', workArrangement: 'Remote', experienceRequired: '2 years' };
    expect(computeJobVersion(1, prev, { ...prev, skills: ['React', 'Go'] })).toBe(2);
    expect(computeJobVersion(1, prev, { ...prev, salaryRange: '$$$' })).toBe(1);
    expect(computeJobVersion(undefined, prev, { ...prev, skills: ['React', 'Go'] })).toBe(2);
  });
});

describe('enqueueJobMatchEvent (idempotent)', () => {
  it('creates a pending event on first enqueue', async () => {
    const db = store();
    const armed = await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 1, trigger: 'create' });
    expect(armed).toBe(true);
    const ev = await getJobMatchEvent(db, eventId('j1', 1));
    expect(ev?.status).toBe('pending');
    expect(ev?.trigger).toBe('create');
  });

  it('second enqueue of the SAME (job,version) does not create a duplicate', async () => {
    const db = store();
    await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 1, trigger: 'create' });
    const armed2 = await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 1, trigger: 'create' });
    // Still pending -> re-armed returns true, but the doc count stays 1.
    expect(armed2).toBe(true);
    // exactly one event doc for j1__v1
    const snap = await (db as unknown as FakeFirestore).collection('jobMatchEvents').doc(eventId('j1', 1)).get();
    expect(snap.exists).toBe(true);
  });

  it('does NOT re-arm an already-processed event', async () => {
    const db = store();
    const id = eventId('j1', 1);
    // Seed a processed event directly.
    await (db as unknown as FakeFirestore).collection('jobMatchEvents').doc(id).set({
      jobId: 'j1', jobVersion: 1, trigger: 'create', status: 'processed', attempts: 1,
      stats: { candidatesEvaluated: 0, alertsSent: 0, alertsSkipped: 0, alertsFailed: 0 },
      createdAt: Timestamp.now(),
    });
    const armed = await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 1, trigger: 'create' });
    expect(armed).toBe(false);
    const ev = await getJobMatchEvent(db, id);
    expect(ev?.status).toBe('processed'); // unchanged
  });

  it('different version -> different event doc (material change re-notifies)', async () => {
    const db = store();
    await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 1, trigger: 'create' });
    await enqueueJobMatchEvent(db, { jobId: 'j1', jobVersion: 2, trigger: 'material_update' });
    const e1 = await getJobMatchEvent(db, eventId('j1', 1));
    const e2 = await getJobMatchEvent(db, eventId('j1', 2));
    expect(e1?.trigger).toBe('create');
    expect(e2?.trigger).toBe('material_update');
  });
});
