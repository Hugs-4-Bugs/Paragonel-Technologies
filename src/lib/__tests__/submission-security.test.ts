/**
 * submission-security.test.ts — contact/lead dedup fingerprint + duplicate
 * detection (Batch 5 Task 3, journey 14 — contact form).
 *
 * The contact + lead routes call fingerprint(email, name, message) to derive a
 * stable non-crypto hash, then isLikelyDuplicate(route, fp) to absorb accidental
 * double-submits (double-click / immediate retry) within a 5-minute window. This
 * test locks that contract so a regression that allowed duplicate contact
 * submissions (false success) or blocked legitimate distinct submissions would
 * fail here.
 */
import { describe, it, expect } from 'vitest';
import { fingerprint, isLikelyDuplicate } from '../submission-security';

describe('fingerprint — stable non-crypto dedup hash', () => {
  it('is deterministic (same inputs → same hash)', () => {
    expect(fingerprint('a@b.com', 'Jane', 'Hello')).toBe(fingerprint('a@b.com', 'Jane', 'Hello'));
  });

  it('is case-insensitive (lowercases before hashing)', () => {
    expect(fingerprint('A@B.COM', 'JANE', 'HELLO')).toBe(fingerprint('a@b.com', 'Jane', 'Hello'));
  });

  it('ignores undefined / empty parts', () => {
    expect(fingerprint('a', undefined, 'b')).toBe(fingerprint('a', 'b'));
    expect(fingerprint('a', '', 'b')).toBe(fingerprint('a', 'b'));
  });

  it('differs for different inputs', () => {
    expect(fingerprint('a@b.com', 'Jane', 'Hello')).not.toBe(fingerprint('x@y.com', 'Jane', 'Hello'));
    expect(fingerprint('a@b.com', 'Jane', 'Hello')).not.toBe(fingerprint('a@b.com', 'Jane', 'Different message'));
  });

  it('returns a stable hex string', () => {
    const fp = fingerprint('a@b.com', 'Jane', 'Hello');
    expect(typeof fp).toBe('string');
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });
});

describe('isLikelyDuplicate — double-submit absorption', () => {
  // Use a unique route per test so the module-level Map does not collide across
  // tests (the Map persists for the vitest run).
  const uniqueRoute = (label: string) => `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  it('returns false on the first submission (records it)', () => {
    const route = uniqueRoute('first');
    const fp = fingerprint('first@example.com', 'A', 'message');
    expect(isLikelyDuplicate(route, fp)).toBe(false);
  });

  it('returns true on an immediate repeat of the same (route, fingerprint)', () => {
    const route = uniqueRoute('repeat');
    const fp = fingerprint('repeat@example.com', 'B', 'message');
    expect(isLikelyDuplicate(route, fp)).toBe(false); // first
    expect(isLikelyDuplicate(route, fp)).toBe(true);  // immediate repeat
  });

  it('is route-scoped: the same fingerprint under a different route is NOT a duplicate', () => {
    const routeA = uniqueRoute('scope-A');
    const routeB = uniqueRoute('scope-B');
    const fp = fingerprint('shared@example.com', 'C', 'message');
    expect(isLikelyDuplicate(routeA, fp)).toBe(false);
    // Same fingerprint, different route — a contact submission is not a
    // duplicate of a lead submission (or vice versa).
    expect(isLikelyDuplicate(routeB, fp)).toBe(false);
  });

  it('returns false for a different fingerprint under the same route', () => {
    const route = uniqueRoute('diff-fp');
    expect(isLikelyDuplicate(route, fingerprint('one@example.com', 'X', 'msg'))).toBe(false);
    expect(isLikelyDuplicate(route, fingerprint('two@example.com', 'Y', 'different'))).toBe(false);
  });
});
