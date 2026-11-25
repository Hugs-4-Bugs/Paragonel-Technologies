/**
 * page-gates.test.ts — middleware page-gate path predicates (Batch 5 Task 4).
 *
 * Locks the path decisions for the admin + candidate page gates so a regression
 * that let an unauthorized visitor reach /candidate/* or /admin/* (or that
 * redirected a public auth page) would fail here.
 */
import { describe, it, expect } from 'vitest';
import { requiresAdminGate, requiresUserGate, PUBLIC_ADMIN_PATHS } from '../page-gates';

describe('requiresAdminGate — /admin/** page gate', () => {
  it('requires a gate for /admin + nested admin pages', () => {
    expect(requiresAdminGate('/admin')).toBe(true);
    expect(requiresAdminGate('/admin/jobs')).toBe(true);
    expect(requiresAdminGate('/admin/blog/new')).toBe(true);
    expect(requiresAdminGate('/admin/alerts')).toBe(true);
  });

  it('does NOT gate the public admin auth pages', () => {
    expect(requiresAdminGate('/admin/login')).toBe(false);
    expect(requiresAdminGate('/admin/bootstrap')).toBe(false);
    expect(requiresAdminGate('/admin/accept-invite')).toBe(false);
  });

  it('does NOT gate non-admin paths', () => {
    expect(requiresAdminGate('/')).toBe(false);
    expect(requiresAdminGate('/candidate/profile')).toBe(false);
    expect(requiresAdminGate('/auth/login')).toBe(false);
    expect(requiresAdminGate('/api/admin/jobs')).toBe(false); // API routes gated at handler, not page gate
  });

  it('PUBLIC_ADMIN_PATHS contains exactly the public auth pages (login, bootstrap, recover, accept-invite)', () => {
    expect(PUBLIC_ADMIN_PATHS).toEqual(new Set(['/admin/login', '/admin/bootstrap', '/admin/recover', '/admin/accept-invite']));
  });

  it('requiresAdminGate is false for /admin/recover (public recovery page)', () => {
    expect(requiresAdminGate('/admin/recover')).toBe(false);
  });
});

describe('requiresUserGate — /candidate/** + /profile page gate', () => {
  it('requires a gate for /candidate + nested candidate pages', () => {
    expect(requiresUserGate('/candidate')).toBe(true);
    expect(requiresUserGate('/candidate/profile')).toBe(true);
    expect(requiresUserGate('/candidate/applications')).toBe(true);
    expect(requiresUserGate('/candidate/jobs')).toBe(true);
  });

  it('requires a gate for the legacy /profile route (redirect stub to /candidate/profile)', () => {
    expect(requiresUserGate('/profile')).toBe(true);
  });

  it('does NOT gate public auth + marketing paths', () => {
    expect(requiresUserGate('/')).toBe(false);
    expect(requiresUserGate('/auth/login')).toBe(false);
    expect(requiresUserGate('/auth/register')).toBe(false);
    expect(requiresUserGate('/jobs')).toBe(false);
    expect(requiresUserGate('/our-product/acquisitionos')).toBe(false);
    expect(requiresUserGate('/services')).toBe(false);
  });

  it('does NOT gate /api/candidate/** (API routes gated at handler, not page gate)', () => {
    expect(requiresUserGate('/api/candidate/profile')).toBe(false);
    expect(requiresUserGate('/api/candidate/resume')).toBe(false);
  });

  it('does NOT gate /admin/** (covered by requiresAdminGate)', () => {
    expect(requiresUserGate('/admin')).toBe(false);
    expect(requiresUserGate('/admin/jobs')).toBe(false);
  });
});
