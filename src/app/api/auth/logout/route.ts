/**
 * POST /api/auth/logout — revoke the current session + clear cookie (Part B).
 *
 * Works for both user and admin sessions (whichever cookie is present).
 */
import { NextResponse } from 'next/server';
import { verifySession, revokeSession, clearSessionCookie } from '@/lib/auth/sessions';
import { getClientIp } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const _ip = getClientIp(request);
  const v = await verifySession(request);
  if (v.ok) {
    await revokeSession(v.user.sid);
  }
  // Clear both cookies regardless (idempotent).
  const response = NextResponse.json({ message: 'Logged out.' });
  clearSessionCookie(response, 'user');
  clearSessionCookie(response, 'admin');
  return response;
}
