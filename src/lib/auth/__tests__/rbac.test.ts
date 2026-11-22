import { describe, it, expect } from 'vitest';
import {
  roleHasPermission,
  permissionsForRole,
  ROLES,
  type Permission,
} from '../rbac';

describe('RBAC (Part C / Part H #11–14)', () => {
  it('VIEWER can read CMS but cannot mutate', () => {
    expect(roleHasPermission('viewer', 'cms.read')).toBe(true);
    expect(roleHasPermission('viewer', 'cms.create')).toBe(false);
    expect(roleHasPermission('viewer', 'cms.update')).toBe(false);
    expect(roleHasPermission('viewer', 'cms.delete')).toBe(false);
    expect(roleHasPermission('viewer', 'jobs.manage')).toBe(false);
  });

  it('EDITOR can create/update/delete CMS but cannot manage admins', () => {
    expect(roleHasPermission('editor', 'cms.create')).toBe(true);
    expect(roleHasPermission('editor', 'cms.update')).toBe(true);
    expect(roleHasPermission('editor', 'cms.delete')).toBe(true);
    expect(roleHasPermission('editor', 'admins.create')).toBe(false);
    expect(roleHasPermission('editor', 'roles.manage')).toBe(false);
  });

  it('ADMIN can manage CMS + jobs + users but CANNOT create admins / manage roles / read security audit', () => {
    expect(roleHasPermission('admin', 'cms.delete')).toBe(true);
    expect(roleHasPermission('admin', 'jobs.manage')).toBe(true);
    expect(roleHasPermission('admin', 'users.update')).toBe(true);
    // Super-admin-only operations are denied to ADMIN (Part H #11, #12):
    expect(roleHasPermission('admin', 'admins.create')).toBe(false);
    expect(roleHasPermission('admin', 'admins.update')).toBe(false);
    expect(roleHasPermission('admin', 'admins.suspend')).toBe(false);
    expect(roleHasPermission('admin', 'roles.manage')).toBe(false);
    expect(roleHasPermission('admin', 'security.audit.read')).toBe(false);
    expect(roleHasPermission('admin', 'security.sessions.revoke')).toBe(false);
  });

  it('SUPER_ADMIN has every permission', () => {
    const all: Permission[] = [
      'users.read', 'users.update', 'admins.read', 'admins.create', 'admins.update',
      'admins.suspend', 'admins.invite', 'roles.read', 'roles.manage',
      'cms.read', 'cms.create', 'cms.update', 'cms.delete', 'jobs.manage',
      'security.audit.read', 'security.sessions.revoke',
    ];
    for (const p of all) expect(roleHasPermission('super_admin', p)).toBe(true);
  });

  it('only SUPER_ADMIN holds SUPER_ADMIN_ONLY permissions (no self-promotion by ADMIN)', () => {
    // An ADMIN tampering with its own JWT role to 'super_admin' would still be
    // rejected by verifySession (role read from account doc). Here we assert the
    // permission map itself never grants super-admin-only perms to non-super roles.
    const saOnly = ['admins.create', 'admins.update', 'admins.suspend', 'admins.invite', 'roles.manage', 'security.audit.read', 'security.sessions.revoke'] as Permission[];
    for (const role of ['admin', 'editor', 'viewer'] as const) {
      for (const p of saOnly) expect(roleHasPermission(role, p)).toBe(false);
    }
  });

  it('permissionsForRole returns a new array per role (no shared mutation)', () => {
    const a = permissionsForRole('editor');
    a.push('roles.manage');
    expect(permissionsForRole('editor')).not.toContain('roles.manage');
  });

  it('ROLES lists the four-tier hierarchy in order', () => {
    expect(ROLES).toEqual(['super_admin', 'admin', 'editor', 'viewer']);
  });
});
