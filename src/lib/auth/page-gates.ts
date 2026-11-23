/**
 * page-gates.ts — path predicates for middleware page-gating (Batch 5 Task 4).
 *
 * Extracted from src/middleware.ts so the page-gate path decisions are
 * unit-testable (the middleware itself runs on the Edge runtime + is awkward to
 * test directly). PURE + Edge-safe — no Node-only APIs, no firebase-admin, no
 * zod. Safe to import from src/middleware.ts.
 *
 * These predicates decide ONLY which paths require a page-level session check.
 * The actual JWT verification (jose) + cookie handling stay in the middleware.
 * Data-route enforcement (revocation, suspension, RBAC) is in
 * src/lib/auth/sessions.ts verifySession — the page gate is a UX + defense-
 * in-depth layer that prevents the unauthorized page shell from rendering
 * before the client-side 401-redirect fires.
 */

/** Public admin-area pages that do NOT require an authenticated admin session. */
export const PUBLIC_ADMIN_PATHS = new Set<string>([
  '/admin/login',
  '/admin/bootstrap',
  '/admin/accept-invite',
]);

/** True if the path requires an admin-tier session (the /admin/** page gate). */
export function requiresAdminGate(pathname: string): boolean {
  return pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.has(pathname);
}

/**
 * True if the path requires a user-tier (candidate) session (the /candidate/**
 * + /profile page gate). The legacy /profile route is a client redirect to
 * /candidate/profile; gating it here prevents an unauthorized visitor from
 * seeing the candidate shell flash before the redirect.
 */
export function requiresUserGate(pathname: string): boolean {
  return pathname.startsWith('/candidate') || pathname === '/profile';
}
