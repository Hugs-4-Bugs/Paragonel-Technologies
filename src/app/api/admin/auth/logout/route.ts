/**
 * POST /api/admin/auth/logout — revoke the admin session + clear cookie (Part B/F).
 */
import { NextResponse } from 'next/server';
import { verifySession, revokeSession, clearSessionCookie } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const v = await verifySession(request, undefined, 'admin');
  if (v.ok) {
    await revokeSession(v.user.sid);
    await logSecurityEvent({ type: 'session_revoked', email: v.user.email, ip, actor: v.user.email, detail: 'logout' });
  }
  const response = NextResponse.json({ message: 'Logged out.' });
  clearSessionCookie(response, 'admin');
  return response;
}
