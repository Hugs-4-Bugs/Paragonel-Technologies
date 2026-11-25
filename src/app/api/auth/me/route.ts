/**
 * GET /api/auth/me — current session info (Part B).
 *
 * Returns the authenticated user's email, name, tier, role, and permissions
 * (the permissions derived server-side from the account doc role, never from
 * the JWT claim). 401 if no valid session.
 *
 * The `name` field is read from the account doc (users/admins) so the navbar
 * chrome can display the user's display name without a second round-trip. It
 * is informational only — `verifySession` remains the single source of truth
 * for authentication.
 */
import { verifySession } from '@/lib/auth/sessions';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request);
  if (!v.ok) return v.response;

  // Read the display name from the account doc (best-effort; never blocks the
  // session response — if the read fails, name is simply absent).
  let name: string | undefined;
  try {
    const db = getAdminDb();
    if (db) {
      const col = v.user.tier === 'admin' ? 'admins' : 'users';
      const snap = await db.collection(col).doc(v.user.email).get();
      const data = snap.exists ? (snap.data() as { name?: string; fullName?: string }) : null;
      name = data?.name ?? data?.fullName;
    }
  } catch {
    // Non-fatal: the session is still valid; name is just unavailable.
  }

  return Response.json({
    user: {
      email: v.user.email,
      name,
      tier: v.user.tier,
      role: v.user.role,
      permissions: v.user.permissions,
    },
  });
}
