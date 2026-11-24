/**
 * global-threshold.test.ts — admin-configurable global matching-threshold floor
 * (Prompt §5.2). Tests the pure clamp + the reader/writer behavior when the
 * database is unconfigured (the sandbox state — getAdminDb() returns null).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clampGlobalThreshold,
  getGlobalMatchingThreshold,
  setGlobalMatchingThreshold,
  invalidateGlobalMatchingThresholdCache,
  GLOBAL_THRESHOLD_SETTING_KEY,
} from '../global-threshold';
import { MIN_THRESHOLD, MAX_THRESHOLD, DEFAULT_MATCHING_THRESHOLD } from '../preferences';

describe('clampGlobalThreshold (pure, Prompt §5.2 bounds)', () => {
  it('returns the value when in [75, 100]', () => {
    expect(clampGlobalThreshold(75)).toBe(75);
    expect(clampGlobalThreshold(80)).toBe(80);
    expect(clampGlobalThreshold(100)).toBe(100);
  });
  it('clamps below 75 UP to 75 (admin can never lower below the floor)', () => {
    expect(clampGlobalThreshold(0)).toBe(75);
    expect(clampGlobalThreshold(50)).toBe(75);
    expect(clampGlobalThreshold(74)).toBe(75);
  });
  it('clamps above 100 DOWN to 100 (admin may raise up to 100)', () => {
    expect(clampGlobalThreshold(101)).toBe(100);
    expect(clampGlobalThreshold(999)).toBe(100);
  });
  it('rounds non-integer values', () => {
    expect(clampGlobalThreshold(80.6)).toBe(81);
    expect(clampGlobalThreshold(80.4)).toBe(80);
  });
  it('falls back to the default (80) for non-finite input', () => {
    expect(clampGlobalThreshold(NaN)).toBe(DEFAULT_MATCHING_THRESHOLD);
  });
});

describe('getGlobalMatchingThreshold (DB unconfigured — sandbox state)', () => {
  beforeEach(() => {
    invalidateGlobalMatchingThresholdCache();
  });

  it('returns the DEFAULT (80) when the database is not configured (getAdminDb() === null)', async () => {
    // In the test sandbox no Firebase credentials are provisioned, so
    // getAdminDb() returns null and the reader falls back to the default.
    const v = await getGlobalMatchingThreshold();
    expect(v).toBe(DEFAULT_MATCHING_THRESHOLD);
    expect(v).toBe(80);
  });

  it('never throws on a read failure (matching must still run)', async () => {
    await expect(getGlobalMatchingThreshold()).resolves.toBeDefined();
  });

  it('caches the value (second read does not re-fetch)', async () => {
    const first = await getGlobalMatchingThreshold();
    const second = await getGlobalMatchingThreshold();
    expect(first).toBe(second);
  });
});

describe('setGlobalMatchingThreshold (DB unconfigured)', () => {
  beforeEach(() => {
    invalidateGlobalMatchingThresholdCache();
  });

  it('throws an honest "Service unavailable" when the database is not configured', async () => {
    await expect(setGlobalMatchingThreshold(85)).rejects.toThrow(/Service unavailable/);
  });
});

describe('GLOBAL_THRESHOLD_SETTING_KEY', () => {
  it('is the app_settings doc/key name (mirrors the 0008/0009 SQL seed)', () => {
    expect(GLOBAL_THRESHOLD_SETTING_KEY).toBe('matching_threshold_floor');
  });
});

describe('range constants agreement (Prompt §5.2: default 80, min 75, max 100)', () => {
  it('DEFAULT is 80, MIN is 75, MAX is 100', () => {
    expect(DEFAULT_MATCHING_THRESHOLD).toBe(80);
    expect(MIN_THRESHOLD).toBe(75);
    expect(MAX_THRESHOLD).toBe(100);
  });
});
