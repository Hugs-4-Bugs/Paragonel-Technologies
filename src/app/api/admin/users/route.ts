/**
 * GET /api/admin/users — list registered users (Part C/G).
 *
 * Requires 'users.read' (admin+). Returns sanitized user docs (no passwordHash).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requirePermission } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requirePermission(request, 'users.read');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snaps = await db.collection('users').orderBy('createdAt', 'desc').limit(200).get();
  const users = snaps.docs.map((d) => {
    const data = d.data() as { email: string; status: string; emailVerified?: boolean; createdAt?: unknown; lastLoginAt?: unknown };
    return {
      email: data.email,
      status: data.status,
      emailVerified: !!data.emailVerified,
      createdAt: data.createdAt ?? null,
      lastLoginAt: data.lastLoginAt ?? null,
    };
  });
  return NextResponse.json({ users });
}
