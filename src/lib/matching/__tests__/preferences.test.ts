/**
 * preferences.test.ts — threshold clamping (25-100, default 80), opt-in
 * resolution, and strict schema validation (Prompt 05R §5, §9).
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

describe('preferences (Prompt 05R §5)', () => {
  describe('resolveMatchingThreshold (clamp + default 80)', () => {
    it('returns 80 (default) when undefined/null/non-number', () => {
      expect(resolveMatchingThreshold(undefined)).toBe(80);
      expect(resolveMatchingThreshold(null)).toBe(80);
      expect(resolveMatchingThreshold('abc')).toBe(80);
    });
    it('returns the stored value when in [25, 100]', () => {
      expect(resolveMatchingThreshold(80)).toBe(80);
      expect(resolveMatchingThreshold(25)).toBe(25);
      expect(resolveMatchingThreshold(100)).toBe(100);
      expect(resolveMatchingThreshold(73)).toBe(73);
    });
    it('clamps values below 25 UP to 25', () => {
      expect(resolveMatchingThreshold(0)).toBe(25);
      expect(resolveMatchingThreshold(10)).toBe(25);
      expect(resolveMatchingThreshold(24)).toBe(25);
    });
    it('clamps values above 100 DOWN to 100', () => {
      expect(resolveMatchingThreshold(101)).toBe(100);
      expect(resolveMatchingThreshold(999)).toBe(100);
    });
    it('rounds non-integer stored values', () => {
      expect(resolveMatchingThreshold(80.6)).toBe(81);
      expect(resolveMatchingThreshold(80.4)).toBe(80);
    });
    it('default is 80 and range is 25-100 (constants)', () => {
      expect(DEFAULT_MATCHING_THRESHOLD).toBe(80);
      expect(MIN_THRESHOLD).toBe(25);
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

  describe('jobAlertPreferencesSchema (strict validation)', () => {
    it('accepts a valid preferences body', () => {
      const r = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 80,
      });
      expect(r.success).toBe(true);
    });
    it('rejects a threshold below 25', () => {
      const r = jobAlertPreferencesSchema.safeParse({
        jobAlertPreference: true,
        matchingThreshold: 10,
      });
      expect(r.success).toBe(false);
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
