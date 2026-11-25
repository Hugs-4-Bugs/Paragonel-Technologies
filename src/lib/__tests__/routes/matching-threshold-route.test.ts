/**
 * matching-threshold-route.test.ts — route-level authorization + 503 + audit-log
 * regression coverage for PATCH /api/admin/jobs/matching-threshold (Issue 3/5).
 *
 * The existing matching-threshold.test.ts locks the patchSchema validation (pure)
 * + documents the auth contract in prose. This file EXERCISES the contract by
 * invoking the real GET/PATCH handlers with mocked auth + Supabase layers, so a
 * regression that lets a non-super-admin write the global floor (or that returns
 * 200 when the store is unconfigured) is caught at test time, not at review.
 *
 * Mocked: verifyAdminPermission (role + ok), getGlobalMatchingThreshold,
 *   setGlobalMatchingThreshold (success/throw), appSettingsStoreConfigured,
 *   insertAuditLog (verifies the Supabase audit write replaces the Firestore one).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mock state (mutated per-test) ---
let authOk = true;
let authRole: 'super_admin' | 'admin' = 'super_admin';
let authPerm = 'cms.read';
let thresholdValue = 80;
let setThrows: string | null = null;
let storeConfigured = true;
let auditCalled = false;
let auditAction = '';
let auditDetail: Record<string, unknown> | null = null;

vi.mock('@/lib/admin-auth', () => ({
  verifyAdminPermission: vi.fn(async (_req: Request, perm: string) => {
    authPerm = perm;
    return authOk
      ? { ok: true, user: { email: 'super@example.com', role: authRole } }
      : { ok: false, response: new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 }) };
  }),
}));

vi.mock('@/lib/matching/global-threshold', () => ({
  getGlobalMatchingThreshold: vi.fn(async () => thresholdValue),
  setGlobalMatchingThreshold: vi.fn(async (v: number) => {
    if (setThrows) throw new Error(setThrows);
    thresholdValue = v;
    return v;
  }),
}));

vi.mock('@/lib/supabase/data/app-settings', () => ({
  appSettingsStoreConfigured: vi.fn(() => storeConfigured),
}));

vi.mock('@/lib/supabase/data/audit-logs', () => ({
  insertAuditLog: vi.fn(async (action: string, _email: string, detail: Record<string, unknown> | null) => {
    auditCalled = true;
    auditAction = action;
    auditDetail = detail;
    return true;
  }),
}));

import { GET, PATCH } from '@/app/api/admin/jobs/matching-threshold/route';

beforeEach(() => {
  authOk = true;
  authRole = 'super_admin';
  thresholdValue = 80;
  setThrows = null;
  storeConfigured = true;
  auditCalled = false;
  auditAction = '';
  auditDetail = null;
});

function getReq(): Request {
  return new Request('https://paragonel.vercel.app/api/admin/jobs/matching-threshold');
}
function patchReq(body: unknown): Request {
  return new Request('https://paragonel.vercel.app/api/admin/jobs/matching-threshold', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/jobs/matching-threshold — authorization', () => {
  it('rejects an unauthenticated request (401)', async () => {
    authOk = false;
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('returns 200 + canEdit=false for a non-super admin (cms.read)', async () => {
    authRole = 'admin';
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    expect(authPerm).toBe('cms.read');
    const data = await res.json();
    expect(data.canEdit).toBe(false);
    expect(data.minimum_matching_percentage).toBe(80);
    expect(data.min).toBe(75);
    expect(data.max).toBe(100);
    expect(data.default).toBe(80);
  });

  it('returns 200 + canEdit=true for a super_admin', async () => {
    authRole = 'super_admin';
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.canEdit).toBe(true);
  });

  it('reports storeConfigured=false when Supabase is not configured', async () => {
    storeConfigured = false;
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.storeConfigured).toBe(false);
  });
});

describe('PATCH /api/admin/jobs/matching-threshold — authorization', () => {
  it('rejects an unauthenticated request (401)', async () => {
    authOk = false;
    const res = await PATCH(patchReq({ minimum_matching_percentage: 85 }));
    expect(res.status).toBe(401);
  });

  it('rejects a non-super admin (403) — mirrors the Supabase RLS settings_write_super policy', async () => {
    authRole = 'admin';
    const res = await PATCH(patchReq({ minimum_matching_percentage: 85 }));
    expect(res.status).toBe(403);
    expect(authPerm).toBe('cms.update');
  });

  it('rejects an invalid value below 75 (400)', async () => {
    const res = await PATCH(patchReq({ minimum_matching_percentage: 50 }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid value above 100 (400)', async () => {
    const res = await PATCH(patchReq({ minimum_matching_percentage: 150 }));
    expect(res.status).toBe(400);
  });

  it('rejects a non-integer (400)', async () => {
    const res = await PATCH(patchReq({ minimum_matching_percentage: 80.5 }));
    expect(res.status).toBe(400);
  });

  it('accepts a valid value from a super_admin (200) + writes the Supabase audit log', async () => {
    const res = await PATCH(patchReq({ minimum_matching_percentage: 85 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.minimum_matching_percentage).toBe(85);
    // The audit log MUST be written to Supabase (not Firestore) — Issue 1 migration.
    expect(auditCalled).toBe(true);
    expect(auditAction).toBe('matching_threshold_update');
    expect(auditDetail?.value).toBe(85);
  });

  it('returns 503 when the Supabase store is unavailable (fail-closed, not 500)', async () => {
    setThrows = 'Service unavailable: the Supabase server client is not configured.';
    const res = await PATCH(patchReq({ minimum_matching_percentage: 85 }));
    expect(res.status).toBe(503);
    // The audit log must NOT have been called (the set threw before the audit).
    expect(auditCalled).toBe(false);
  });

  it('returns 500 for an unexpected (non-503) error', async () => {
    setThrows = 'Unexpected database connection reset.';
    const res = await PATCH(patchReq({ minimum_matching_percentage: 85 }));
    expect(res.status).toBe(500);
  });
});
