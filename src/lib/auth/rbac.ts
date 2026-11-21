/**
 * rbac.ts — server-enforced Role-Based Access Control.
 *
 * Roles: SUPER_ADMIN > ADMIN > EDITOR > VIEWER. Permissions are granular
 * (`users.read`, `cms.create`, …) and mapped to roles through ROLE_PERMISSIONS.
 *
 * CRITICAL: role/permission claims in the JWT are a PERFORMANCE CACHE only.
 * The authoritative source is the `admins/{email}` document read server-side
 * in `verifySession`. A browser can claim any role it wants; `verifySession`
 * re-reads the doc and checks `status === 'active'` + `tokenVersion` match
 * before trusting anything. Hiding a button in React is NEVER security —
 * every protected route calls `requirePermission`.
 */
export type Role = 'super_admin' | 'admin' | 'editor' | 'viewer';
export const ROLES: Role[] = ['super_admin', 'admin', 'editor', 'viewer'];

export type Permission =
  // users
  | 'users.read' | 'users.update'
  // admins
  | 'admins.read' | 'admins.create' | 'admins.update' | 'admins.suspend' | 'admins.invite'
  // roles
  | 'roles.read' | 'roles.manage'
  // cms
  | 'cms.read' | 'cms.create' | 'cms.update' | 'cms.delete'
  // jobs
  | 'jobs.manage'
  // security
  | 'security.audit.read' | 'security.sessions.revoke';

export const PERMISSIONS: Permission[] = [
  'users.read', 'users.update',
  'admins.read', 'admins.create', 'admins.update', 'admins.suspend', 'admins.invite',
  'roles.read', 'roles.manage',
  'cms.read', 'cms.create', 'cms.update', 'cms.delete',
  'jobs.manage',
  'security.audit.read', 'security.sessions.revoke',
];

/**
 * Role → permission map. Server-controlled (the browser never supplies this).
 * - VIEWER: read-only CMS + users list.
 * - EDITOR: full CMS create/update/delete.
 * - ADMIN: everything except Super-Admin-only operations (managing admins,
 *   roles, security audit, session revocation). ADMIN CANNOT promote itself.
 * - SUPER_ADMIN: everything, including roles.manage (the only role that can
 *   grant/revoke SUPER_ADMIN).
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['cms.read', 'users.read'],
  editor: ['cms.read', 'cms.create', 'cms.update', 'cms.delete', 'users.read'],
  admin: [
    'cms.read', 'cms.create', 'cms.update', 'cms.delete',
    'jobs.manage',
    'users.read', 'users.update',
    'admins.read', 'roles.read',
  ],
  super_admin: [
    ...PERMISSIONS, // full set
  ],
};

/** Operations only SUPER_ADMIN may perform, regardless of any other grant. */
export const SUPER_ADMIN_ONLY: Permission[] = [
  'admins.create', 'admins.update', 'admins.suspend', 'admins.invite',
  'roles.manage', 'security.audit.read', 'security.sessions.revoke',
];

export function permissionsForRole(role: Role): Permission[] {
  // Return a COPY so a caller cannot mutate the shared role map.
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function roleHasPermission(role: Role, perm: Permission): boolean {
  // Super-admin-only perms are gated to super_admin even if a stale map leaked.
  if (SUPER_ADMIN_ONLY.includes(perm) && role !== 'super_admin') return false;
  return permissionsForRole(role).includes(perm);
}

/** A normalized display label for a role. */
export function roleLabel(role: Role): string {
  return { super_admin: 'Super Admin', admin: 'Admin', editor: 'Editor', viewer: 'Viewer' }[role];
}
