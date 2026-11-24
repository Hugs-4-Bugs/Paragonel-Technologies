/**
 * audit-logs.test.ts — Supabase-backed admin audit log (Issue 1 incremental migration).
 * Locks: insertAuditLog returns true/false; the insert carries the action + actor_email
 * + detail + target fields; false when Supabase is unconfigured or the write errors.
 * Mocks the Supabase server client (no real DB in the sandbox).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const insertMock = vi.fn().mockResolvedValue({ error: null });
const fromMock = vi.fn().mockImplementation(() => ({ insert: insertMock }));
const getSupabaseServerMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => getSupabaseServerMock(),
}));

import { insertAuditLog, auditLogsStoreConfigured } from '../audit-logs';

beforeEach(() => {
  insertMock.mockReset();
  fromMock.mockClear();
  getSupabaseServerMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
});

describe('insertAuditLog', () => {
  it('returns true + inserts the correct row shape on success', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    const ok = await insertAuditLog(
      'matching_threshold_update',
      'super@example.com',
      { value: 85, detail: 'Global matching threshold floor set to 85%' },
      'app_settings',
      'matching_threshold_floor',
    );
    expect(ok).toBe(true);
    expect(fromMock).toHaveBeenCalledWith('audit_logs');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0];
    expect(row.action).toBe('matching_threshold_update');
    expect(row.actor_email).toBe('super@example.com');
    expect(row.actor_id).toBeNull(); // populated after Supabase Auth cutover
    expect(row.target_type).toBe('app_settings');
    expect(row.target_id).toBe('matching_threshold_floor');
    expect(row.detail).toEqual({ value: 85, detail: 'Global matching threshold floor set to 85%' });
  });

  it('returns false when Supabase is not configured (fail-closed)', async () => {
    getSupabaseServerMock.mockReturnValue(null);
    const ok = await insertAuditLog('test_action', 'a@b.com');
    expect(ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('returns false when the insert errors (non-fatal — caller must not revert)', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    insertMock.mockResolvedValue({ error: new Error('relation "audit_logs" does not exist') });
    const ok = await insertAuditLog('test_action', 'a@b.com');
    expect(ok).toBe(false);
  });

  it('returns false when the insert throws (caught, non-fatal)', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    insertMock.mockRejectedValue(new Error('network reset'));
    const ok = await insertAuditLog('test_action', 'a@b.com');
    expect(ok).toBe(false);
  });

  it('defaults optional fields to null when not provided', async () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    await insertAuditLog('simple_action', null);
    const row = insertMock.mock.calls[0][0];
    expect(row.action).toBe('simple_action');
    expect(row.actor_email).toBeNull();
    expect(row.target_type).toBeNull();
    expect(row.target_id).toBeNull();
    expect(row.detail).toBeNull();
  });
});

describe('auditLogsStoreConfigured', () => {
  it('returns true when the Supabase server client is configured', () => {
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    expect(auditLogsStoreConfigured()).toBe(true);
  });

  it('returns false when the Supabase server client is null', () => {
    getSupabaseServerMock.mockReturnValue(null);
    expect(auditLogsStoreConfigured()).toBe(false);
  });
});
