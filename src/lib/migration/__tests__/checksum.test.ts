/**
 * checksum.test.ts — deterministic checksum coverage (Task 4).
 */
import { describe, it, expect } from 'vitest';
import { checksumDoc, stableStringify } from '../checksum';
import type { FirestoreDoc } from '../mapper';

const doc = (id: string, data: Record<string, unknown>): FirestoreDoc => ({ id, data });

describe('stableStringify', () => {
  it('sorts object keys recursively', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
  it('normalizes a Firestore Timestamp {_seconds,_nanoseconds} to ISO', () => {
    const out = stableStringify({ at: { _seconds: 1700000000, _nanoseconds: 0 } });
    expect(out).toContain('2023-11-14T22:13:20.000Z');
  });
  it('normalizes a Date to ISO', () => {
    expect(stableStringify({ at: new Date('2024-01-01T00:00:00.000Z') })).toContain('2024-01-01T00:00:00.000Z');
  });
});

describe('checksumDoc', () => {
  it('is deterministic for the same content regardless of key order', () => {
    const a = checksumDoc(doc('x', { b: 1, a: 2 }));
    const b = checksumDoc(doc('x', { a: 2, b: 1 }));
    expect(a).toBe(b);
  });
  it('is a 64-char hex SHA-256', () => {
    expect(checksumDoc(doc('x', { a: 1 })).length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(checksumDoc(doc('x', { a: 1 }))).toString()).toBe('true');
  });
  it('changes when the content changes (drift is detectable)', () => {
    const a = checksumDoc(doc('x', { a: 1 }));
    const b = checksumDoc(doc('x', { a: 2 }));
    expect(a).not.toBe(b);
  });
  it('changes when the doc id changes', () => {
    expect(checksumDoc(doc('x', { a: 1 }))).not.toBe(checksumDoc(doc('y', { a: 1 })));
  });
  it('normalizes Timestamp vs ISO forms of the same instant to the same checksum', () => {
    const a = checksumDoc(doc('x', { at: { _seconds: 1700000000, _nanoseconds: 0 } }));
    const b = checksumDoc(doc('x', { at: '2023-11-14T22:13:20.000Z' }));
    expect(a).toBe(b);
  });
});
