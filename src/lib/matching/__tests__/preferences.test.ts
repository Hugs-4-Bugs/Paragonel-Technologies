/**
 * preferences.test.ts — threshold clamping (75-100, default 80), opt-in
 * resolution, and strict schema validation (Prompt 05R §5, §9; §5.2 75% floor).
 */
import { describe, it, expect } from 'vitest';
import {
  resolveMatchingThreshold,
  resolveJobAlertPreference,
  jobAlertPreferencesSchema,
  DEFAULT_MATCHING_THRESHOLD,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
} from '../preferences';

describe('preferences (Prompt 05R §5, §5.2)', () => {
  describe('resolveMatchingThreshold (clamp + default 80, 75% floor)', () => {
    it('returns 80 (default) when undefined/null/non-number', () => {
      expect(resolveMatchingThreshold(undefined)).toBe(80);
      expect(resolveMatchingThreshold(null)).toBe(80);
      expect(resolveMatchingThreshold('abc')).toBe(80);
    });
    it('returns the stored value when in [75, 100]', () => {
      expect(resolveMatchingThreshold(75)).toBe(75);
      expect(resolveMatchingThreshold(80)).toBe(80);
      expect(resolveMatchingThreshold(100)).toBe(100);
      expect(resolveMatchingThreshold(90)).toBe(90);
    });
    it('clamps values below 75 UP to 75 (Prompt §5.2: never below 75%)', () => {
      expect(resolveMatchingThreshold(0)).toBe(75);
      expect(resolveMatchingThreshold(10)).toBe(75);
      expect(resolveMatchingThreshold(24)).toBe(75);
      expect(resolveMatchingThreshold(74)).toBe(75);
      // legacy 25-74 values (previously allowed) are tightened up to the floor
      expect(resolveMatchingThreshold(25)).toBe(75);
      expect(resolveMatchingThreshold(50)).toBe(75);
      expect(resolveMatchingThreshold(73)).toBe(75);
    });
    it('clamps values above 100 DOWN to 100', () => {
      expect(resolveMatchingThreshold(101)).toBe(100);
      expect(resolveMatchingThreshold(999)).toBe(100);
    });
    it('rounds non-integer stored values', () => {
      expect(resolveMatchingThreshold(80.6)).toBe(81);
      expect(resolveMatchingThreshold(80.4)).toBe(80);
    });
    it('default is 80 and floor is 75 / max 100 (constants)', () => {
      expect(DEFAULT_MATCHING_THRESHOLD).toBe(80);
      expect(MIN_THRESHOLD).toBe(75);
      expect(MAX_THRESHOLD).toBe(100);
    });
  });

  describe('resolveJobAlertPreference (OPT-IN)', () => {
    it('only true enables alerts', () => {
      expect(resolveJobAlertPreference(true)).toBe(true);
    });
    it('undefined / false / anything else => off', () => {
      expect(resolveJobAlertPreference(undefined)).toBe(false);
      expect(resolveJobAlertPreference(false)).toBe(false);
      expect(resolveJobAlertPreference(null)).toBe(false);
      expect(resolveJobAlertPreference('true')).toBe(false);
      expect(resolveJobAlertPreference(1)).toBe(false);
    });
  });

  describe('jobAlertPreferencesSchema (strict validation, 75% floor)', () => {
    it('accepts a valid preferences body at the floor (75) and above', () => {
      const r75 = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 75,
      });
      expect(r75.success).toBe(true);
      const r80 = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 80,
      });
      expect(r80.success).toBe(true);
    });
    it('rejects a threshold below 75 (10 and 74)', () => {
      const r10 = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 10,
      });
      expect(r10.success).toBe(false);
      const r74 = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 74,
      });
      expect(r74.success).toBe(false);
    });
    it('rejects a threshold above 100', () => {
      const r = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: false,
        matchingThreshold: 150,
      });
      expect(r.success).toBe(false);
    });
    it('rejects a non-boolean jobAlertPreference', () => {
      const r = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: 'yes',
        matchingThreshold: 80,
      });
      expect(r.success).toBe(false);
    });
    it('coerces a numeric-string threshold', () => {
      const r = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: '80',
      });
      expect(r.success).toBe(true);
      expect(r.data?.matchingThreshold).toBe(80);
    });
  });
});
