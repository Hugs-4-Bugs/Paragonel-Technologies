/**
 * app-settings.test.ts — Supabase-backed application settings (Prompt §3/§5).
 * Locks: getSetting returns the value / null when unconfigured / null on error;
 * setSetting returns true/false; the upsert carries the key + value. Mocks the
 * Supabase server client (no real DB in the sandbox).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the Supabase server client with a chainable builder.
const maybeSingleMock = vi.fn();
const selectEqChain = {
  eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
};
const selectMock = vi.fn().mockReturnValue(selectEqChain);
const upsertMock = vi.fn().mockResolvedValue({ error: null });
const fromMock = vi.fn().mockImplementation(() => ({
  select: selectMock,
  upsert: upsertMock,
}));
const getSupabaseServerMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => getSupabaseServerMock(),
}));

import { getSetting, setSetting, appSettingsStoreConfigured } from '../app-settings';

describe('getSetting', () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    selectMock.mockClear();
    selectEqChain.eq.mockClear();
    getSupabaseServerMock.mockReset();
  });

  it('returns the jsonb value when the row exists', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    maybeSingleMock.mockResolvedValue({ data: { value: { minimum_matching_percentage: 85 } }, error: null });
    const v = await getSetting('matching_threshold_floor');
    expect(v).toEqual({ minimum_matching_percentage: 85 });
    expect(fromMock).toHaveBeenCalledWith('app_settings');
    expect(selectMock).toHaveBeenCalledWith('value');
  });

  it('returns null when the row is absent (.maybeSingle → data null)', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    expect(await getSetting('any-key')).toBeNull();
  });

  it('returns null when Supabase is not configured (getSupabaseServer → null)', async () => {
    getSupabaseServerMock.mockReturnValue(null);
    expect(await getSetting('any-key')).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns null on a query error', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'rls denied' } });
    expect(await getSetting('any-key')).toBeNull();
  });

  it('returns null when the client throws', async () => {
    getSupabaseServerMock.mockReturnValue({ from: vi.fn(() => { throw new Error('boom'); }) });
    expect(await getSetting('any-key')).toBeNull();
  });
});

describe('setSetting', () => {
  beforeEach(() => {
    upsertMock.mockReset();
    fromMock.mockClear();
    getSupabaseServerMock.mockReset();
  });

  it('upserts the row + returns true on success', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    upsertMock.mockResolvedValue({ error: null });
    const ok = await setSetting('matching_threshold_floor', { minimum_matching_percentage: 80 }, 'user-uuid');
    expect(ok).toBe(true);
    expect(fromMock).toHaveBeenCalledWith('app_settings');
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [row, opts] = upsertMock.mock.calls[0];
    expect(row.key).toBe('matching_threshold_floor');
    expect(row.value).toEqual({ minimum_matching_percentage: 80 });
    expect(row.updated_by).toBe('user-uuid');
    expect(opts).toEqual({ onConflict: 'key' });
  });

  it('returns false when Supabase is not configured', async () => {
    getSupabaseServerMock.mockReturnValue(null);
    expect(await setSetting('k', 1)).toBe(false);
  });

  it('returns false on an upsert error', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    upsertMock.mockResolvedValue({ error: { message: 'constraint violation' } });
    expect(await setSetting('k', 1)).toBe(false);
  });

  it('defaults updated_by to null when not provided', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    upsertMock.mockResolvedValue({ error: null });
    await setSetting('k', 1);
    expect(upsertMock.mock.calls[0][0].updated_by).toBeNull();
  });
});

describe('appSettingsStoreConfigured', () => {
  it('true when the server client is configured', () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    expect(appSettingsStoreConfigured()).toBe(true);
  });
  it('false when the server client is null', () => {
    getSupabaseServerMock.mockReturnValue(null);
    expect(appSettingsStoreConfigured()).toBe(false);
  });
});
