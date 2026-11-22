/**
 * GET /api/auth/me — current session info (Part B).
 *
 * Returns the authenticated user's email, tier, role, and permissions (the
 * permissions derived server-side from the account doc role, never from the
 * JWT claim). 401 if no valid session.
 */
import { verifySession } from '@/lib/auth/sessions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request);
  if (!v.ok) return v.response;
  return Response.json({
    user: {
      email: v.user.email,
      tier: v.user.tier,
      role: v.user.role,
      permissions: v.user.permissions,
    },
  });
}
