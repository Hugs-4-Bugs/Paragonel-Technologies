/**
 * GET /api/admin/auth/me — current admin session info (Part B/F).
 *
 * Uses verifySession (server-side revocation + suspension + tokenVersion
 * checks). Returns the admin's email, role, and server-derived permissions.
 */
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/sessions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'admin');
  if (!v.ok) return v.response;
  return NextResponse.json({
    user: {
      email: v.user.email,
      tier: v.user.tier,
      role: v.user.role,
      permissions: v.user.permissions,
    },
  });
}
