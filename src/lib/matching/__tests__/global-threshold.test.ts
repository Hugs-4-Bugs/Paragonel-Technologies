/**
 * global-threshold.test.ts — admin-configurable global matching-threshold floor,
 * Supabase-backed (Prompt §5.1/§5.2). Locks: pure clamp + the reader/writer via
 * the Supabase data-access layer (mocked — no real DB in the sandbox) + the
 * unconfigured fallback (default 80) + cache invalidation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { getSettingMock, setSettingMock } = vi.hoisted(() => ({
  getSettingMock: vi.fn(),
  setSettingMock: vi.fn(),
}));
vi.mock('@/lib/supabase/data/app-settings', () => ({
  getSetting: getSettingMock,
  setSetting: setSettingMock,
}));

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

describe('getGlobalMatchingThreshold (Supabase-backed)', () => {
  beforeEach(() => {
    invalidateGlobalMatchingThresholdCache();
    getSettingMock.mockReset();
  });

  it('returns the DEFAULT (80) when Supabase returns null (unconfigured/unset)', async () => {
    getSettingMock.mockResolvedValue(null);
    const v = await getGlobalMatchingThreshold();
    expect(v).toBe(DEFAULT_MATCHING_THRESHOLD);
    expect(v).toBe(80);
    expect(getSettingMock).toHaveBeenCalledWith(GLOBAL_THRESHOLD_SETTING_KEY);
  });

  it('returns the persisted value when Supabase has the row', async () => {
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 85 });
    expect(await getGlobalMatchingThreshold()).toBe(85);
  });

  it('clamps a persisted value below 75 UP to 75 (defense-in-depth)', async () => {
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 50 });
    expect(await getGlobalMatchingThreshold()).toBe(75);
  });

  it('clamps a persisted value above 100 DOWN to 100', async () => {
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 150 });
    expect(await getGlobalMatchingThreshold()).toBe(100);
  });

  it('returns the default (80) for a malformed persisted value', async () => {
    getSettingMock.mockResolvedValue({ wrong_field: 90 });
    expect(await getGlobalMatchingThreshold()).toBe(80);
  });

  it('never throws on a read failure (matching must still run)', async () => {
    getSettingMock.mockRejectedValue(new Error('supabase down'));
    await expect(getGlobalMatchingThreshold()).resolves.toBe(80);
  });

  it('caches the value (second read within TTL does not re-fetch)', async () => {
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 85 });
    await getGlobalMatchingThreshold();
    await getGlobalMatchingThreshold();
    expect(getSettingMock).toHaveBeenCalledTimes(1);
  });

  it('cache invalidation forces a re-fetch', async () => {
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 85 });
    await getGlobalMatchingThreshold();
    invalidateGlobalMatchingThresholdCache();
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 90 });
    expect(await getGlobalMatchingThreshold()).toBe(90);
    expect(getSettingMock).toHaveBeenCalledTimes(2);
  });
});

describe('setGlobalMatchingThreshold (Supabase-backed)', () => {
  beforeEach(() => {
    invalidateGlobalMatchingThresholdCache();
    setSettingMock.mockReset();
  });

  it('persists the clamped value + returns it on success', async () => {
    setSettingMock.mockResolvedValue(true);
    const v = await setGlobalMatchingThreshold(85);
    expect(v).toBe(85);
    expect(setSettingMock).toHaveBeenCalledWith(
      GLOBAL_THRESHOLD_SETTING_KEY,
      { minimum_matching_percentage: 85 },
    );
  });

  it('clamps the input before persisting (admin may raise to 100, never below 75)', async () => {
    setSettingMock.mockResolvedValue(true);
    await setGlobalMatchingThreshold(150);
    expect(setSettingMock.mock.calls[0][1]).toEqual({ minimum_matching_percentage: 100 });
    setSettingMock.mockClear();
    await setGlobalMatchingThreshold(10);
    expect(setSettingMock.mock.calls[0][1]).toEqual({ minimum_matching_percentage: 75 });
  });

  it('throws an honest "Service unavailable" when the Supabase write fails', async () => {
    setSettingMock.mockResolvedValue(false);
    await expect(setGlobalMatchingThreshold(85)).rejects.toThrow(/Service unavailable/);
  });

  it('invalidates the cache after a successful write (next read re-fetches)', async () => {
    setSettingMock.mockResolvedValue(true);
    getSettingMock.mockResolvedValue({ minimum_matching_percentage: 85 });
    await setGlobalMatchingThreshold(85);
    // After the write, the cache holds 85; a read returns it without re-fetching.
    expect(await getGlobalMatchingThreshold()).toBe(85);
    expect(getSettingMock).not.toHaveBeenCalled();
  });
});

describe('GLOBAL_THRESHOLD_SETTING_KEY', () => {
  it('is the app_settings key (mirrors the 0008/0009 SQL seed)', () => {
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
