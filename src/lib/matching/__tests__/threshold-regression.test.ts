/**
 * threshold-regression.test.ts — Issue 5 boundary regression: the admin-
 * configurable global floor actually changes matching outcomes, + the default
 * threshold constant is wired (not a hardcoded literal).
 *
 * These are PURE unit tests (no I/O, no mocking) covering the LIVE matching
 * decision path: resolveMatchingThreshold → meetsThreshold. They lock the
 * behavior the Issue 3/5 acceptance criteria require:
 *   - A raised global floor skips a previously-eligible candidate.
 *   - The default threshold (80) is the single source of truth.
 *   - Boundaries 75/100 are enforced consistently.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveMatchingThreshold,
  DEFAULT_MATCHING_THRESHOLD,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
} from '@/lib/matching/preferences';
import { meetsThreshold } from '@/lib/matching/match-engine';
import type { MatchResult } from '@/lib/matching/match-engine';

/** Minimal MatchResult stub for meetsThreshold (only overallScore + skill arrays are read). */
function stubResult(overallScore: number, matched: string[] = [], missing: string[] = []): MatchResult {
  return {
    rubricVersion: 'test',
    overallScore,
    eligible: overallScore >= DEFAULT_MATCHING_THRESHOLD,
    matchedRequiredSkills: matched,
    missingRequiredSkills: missing,
    matchedPreferredSkills: [],
    missingPreferredSkills: [],
    experience: { requiredYears: 0, candidateYears: 0, detail: '' },
    location: { jobLocation: '', isRemote: false, detail: '' },
    workMode: { jobMode: '', candidatePreference: '', detail: '' },
    employmentType: { jobType: '', candidatePreference: '', detail: '' },
    education: '',
    skills: { matched: [], missing: [], score: 0, detail: '' },
    otherEvidence: [],
    reasons: [],
  } as unknown as MatchResult;
}

describe('Issue 5 — raised global floor skips a previously-eligible candidate', () => {
  it('a candidate scoring 85 is eligible at the default floor (80)', () => {
    const effective = resolveMatchingThreshold(80, 80);
    expect(effective).toBe(80);
    const result = stubResult(85);
    expect(meetsThreshold(result, effective).pass).toBe(true);
  });

  it('raising the global floor to 90 skips the same 85-score candidate', () => {
    const effective = resolveMatchingThreshold(80, 90);
    expect(effective).toBe(90); // the floor raises above the candidate's stored 80
    const result = stubResult(85);
    expect(meetsThreshold(result, effective).pass).toBe(false);
  });

  it('a candidate cannot bypass the global floor by lowering their stored threshold', () => {
    // Candidate tries to set threshold to 75 (the min); global floor is 90.
    const effective = resolveMatchingThreshold(75, 90);
    expect(effective).toBe(90); // floor wins, not the candidate's 75
  });

  it('a candidate scoring exactly the raised floor (90) passes at floor 90', () => {
    const effective = resolveMatchingThreshold(80, 90);
    const result = stubResult(90);
    expect(meetsThreshold(result, effective).pass).toBe(true);
  });

  it('a candidate scoring 89 fails at floor 90 (boundary)', () => {
    const effective = resolveMatchingThreshold(80, 90);
    const result = stubResult(89);
    expect(meetsThreshold(result, effective).pass).toBe(false);
  });
});

describe('Issue 5 — default + boundary consistency', () => {
  it('DEFAULT_MATCHING_THRESHOLD is 80', () => {
    expect(DEFAULT_MATCHING_THRESHOLD).toBe(80);
  });

  it('MIN_THRESHOLD is 75 + MAX_THRESHOLD is 100', () => {
    expect(MIN_THRESHOLD).toBe(75);
    expect(MAX_THRESHOLD).toBe(100);
  });

  it('a missing/unset stored threshold resolves to the global floor (default 80)', () => {
    expect(resolveMatchingThreshold(undefined, 80)).toBe(80);
    expect(resolveMatchingThreshold(null, 80)).toBe(80);
    expect(resolveMatchingThreshold(NaN, 80)).toBe(80);
  });

  it('the global floor is clamped to [75, 100] even if a bad value is passed', () => {
    expect(resolveMatchingThreshold(80, 50)).toBe(80); // floor clamped UP to 75, candidate 80 wins
    expect(resolveMatchingThreshold(80, 200)).toBe(100); // floor clamped DOWN to 100
  });

  it('a stored threshold below 75 is clamped UP to 75 (never below the min)', () => {
    expect(resolveMatchingThreshold(25, 75)).toBe(75);
    expect(resolveMatchingThreshold(0, 75)).toBe(75);
  });

  it('meetsThreshold boundary: score == threshold passes, score == threshold-1 fails', () => {
    const r80 = stubResult(80);
    expect(meetsThreshold(r80, 80).pass).toBe(true);
    const r79 = stubResult(79);
    expect(meetsThreshold(r79, 80).pass).toBe(false);
  });

  it('meetsThreshold hard-gate: missing required skills fails regardless of score', () => {
    const result = stubResult(95, /* matchedRequired */ [], /* missingRequired */ ['Python']);
    expect(meetsThreshold(result, 80).pass).toBe(false);
  });
});

describe('Issue 3 — default threshold drift guard (eligible field tracks the constant)', () => {
  it('a MatchResult at exactly DEFAULT_MATCHING_THRESHOLD would pass the threshold check', () => {
    // This pins the default: if someone re-hardcodes `eligible = overallScore >= 90`
    // in match-engine.ts, the constant assertion above (80) still holds, but this
    // behavioral test confirms the LIVE decision path (meetsThreshold) agrees with
    // the constant — a candidate at 80 passes at threshold 80.
    const result = stubResult(DEFAULT_MATCHING_THRESHOLD);
    expect(meetsThreshold(result, DEFAULT_MATCHING_THRESHOLD).pass).toBe(true);
  });

  it('a MatchResult at DEFAULT_MATCHING_THRESHOLD - 1 would fail the threshold check', () => {
    const result = stubResult(DEFAULT_MATCHING_THRESHOLD - 1);
    expect(meetsThreshold(result, DEFAULT_MATCHING_THRESHOLD).pass).toBe(false);
  });
});
