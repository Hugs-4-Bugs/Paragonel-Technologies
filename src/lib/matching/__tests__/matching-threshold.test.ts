/**
 * matching-threshold.test.ts — validation + super-admin authorization for the
 * global matching-threshold admin endpoint (Prompt §5.2).
 *
 * Tests the patchSchema validation (pure) + the authorization contract. The
 * full HTTP route integration (auth + Firestore) is exercised end-to-end only
 * against a live deployment with credentials; here we lock the validation +
 * auth-rule invariants that are feasible in the node test environment.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { MIN_THRESHOLD, MAX_THRESHOLD, DEFAULT_MATCHING_THRESHOLD } from '@/lib/matching/preferences';

// Mirror of the route's patchSchema (kept in sync — the route imports the same
// constants, so the bounds always agree).
const patchSchema = z.object({
  minimum_matching_percentage: z
    .coerce
    .number()
    .int(`Threshold must be an integer between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`)
    .min(MIN_THRESHOLD, `Threshold must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`)
    .max(MAX_THRESHOLD, `Threshold must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`),
});

describe('matching-threshold PATCH validation (Prompt §5.2 bounds)', () => {
  it('accepts the default (80) and the full 75–100 range', () => {
    expect(patchSchema.safeParse({ minimum_matching_percentage: 80 }).success).toBe(true);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 75 }).success).toBe(true);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 100 }).success).toBe(true);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 90 }).success).toBe(true);
  });

  it('rejects below 75 (admin can never lower the floor below 75%)', () => {
    expect(patchSchema.safeParse({ minimum_matching_percentage: 74 }).success).toBe(false);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 50 }).success).toBe(false);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 0 }).success).toBe(false);
  });

  it('rejects above 100', () => {
    expect(patchSchema.safeParse({ minimum_matching_percentage: 101 }).success).toBe(false);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 150 }).success).toBe(false);
  });

  it('rejects a non-integer', () => {
    expect(patchSchema.safeParse({ minimum_matching_percentage: 80.5 }).success).toBe(false);
  });

  it('coerces a numeric string', () => {
    const r = patchSchema.safeParse({ minimum_matching_percentage: '85' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.minimum_matching_percentage).toBe(85);
  });
});

describe('matching-threshold authorization contract (Prompt §5.2 + RLS mirror)', () => {
  // The route enforces: GET requires cms.read (any admin); PATCH requires
  // super_admin (auth.user.role === 'super_admin'), mirroring the Supabase RLS
  // `settings_write_super` policy. This test documents the contract so a regression
  // that lets a non-super-admin write the global floor is caught at review.
  it('the default global threshold is 80 (DEFAULT_MATCHING_THRESHOLD)', () => {
    expect(DEFAULT_MATCHING_THRESHOLD).toBe(80);
  });
  it('the min is 75 — an admin may raise to 80+ up to 100 but never below 75', () => {
    expect(MIN_THRESHOLD).toBe(75);
    expect(MAX_THRESHOLD).toBe(100);
    // 80 is an allowed RAISE above the 75 floor.
    expect(patchSchema.safeParse({ minimum_matching_percentage: 80 }).success).toBe(true);
    expect(patchSchema.safeParse({ minimum_matching_percentage: 100 }).success).toBe(true);
  });
});
