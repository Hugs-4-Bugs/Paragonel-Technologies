/**
 * sessions.ts — JWT sessions with server-side revocation (Part F).
 *
 * Cookie: httpOnly, SameSite=Lax, Secure in production. Admin sessions use the
 * existing `qf_admin_token` cookie name (middleware + CMS compatibility); user
 * sessions use `qf_user_token`.
 *
 * Revocation model (defense in depth):
 *   - Every issued JWT carries `sid` (session id) + `ver` (the account's
 *     `tokenVersion` at issue time).
 *   - `sessions/{sid}` records {email, tier, role, issuedAt, revokedAt?}.
 *   - On verify, `verifySession` re-reads BOTH the session doc AND the account
 *     doc (`admins/{email}` or `users/{email}`). It rejects if:
 *       * the session doc is missing or `revokedAt` is set, OR
 *       * the account `status !== 'active'` (suspended), OR
 *       * the account `tokenVersion !== ver` (a global revoke bumped it).
 *   - Permission checks use the role read from the ACCOUNT DOC (via rbac.ts),
 *     NEVER the `role`/`perms` claim in the JWT — those are a cache only and a
 *     browser cannot escalate by tampering with them.
 *
 * JWT_SECRET (>= 32 chars) signs/verifies. Missing → fail closed.
 */
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { randomHex, hashIp } from './crypto-utils';
import { type Role, type Permission, roleHasPermission, permissionsForRole } from './rbac';

export type Tier = 'admin' | 'user';

const ADMIN_COOKIE = 'qf_admin_token';
const USER_COOKIE = 'qf_user_token';
const ADMIN_TTL = 8 * 60 * 60; // 8h
const USER_TTL = 24 * 60 * 60; // 24h

export function cookieFor(tier: Tier): string {
  return tier === 'admin' ? ADMIN_COOKIE : USER_COOKIE;
}

export function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) return null;
  return new TextEncoder().encode(raw);
}

export interface IssueSessionInput {
  email: string;
  tier: Tier;
  role: Role; // for admin; ignored for user (defaults 'viewer' semantically)
  ip?: string;
  /** For admin tier: whether TOTP MFA is enrolled. Embedded in the JWT so the
   *  middleware (edge) can enforce super_admin MFA without a Firestore read. */
  mfaEnrolled?: boolean;
}

export interface IssuedSession {
  token: string;
  cookieName: string;
  maxAge: number;
  /** Cookie options ready to pass to response.cookies.set. */
  cookie: { httpOnly: true; secure: boolean; sameSite: 'lax'; path: '/'; maxAge: number };
  sid: string;
}

/** Create a session doc + sign the JWT. */
export async function issueSession(input: IssueSessionInput): Promise<IssuedSession | null> {
  const secret = getJwtSecret();
  const db = getAdminDb();
  if (!secret || !db) return null;

  const email = input.email.toLowerCase().trim();
  const sid = randomHex(16);
  const tier = input.tier;
  const maxAge = tier === 'admin' ? ADMIN_TTL : USER_TTL;

  // Read the account's current tokenVersion to embed as `ver`.
  const col = tier === 'admin' ? 'admins' : 'users';
  const accSnap = await db.collection(col).doc(email).get();
  const tokenVersion = (accSnap.data()?.tokenVersion as number) ?? 0;

  // Persist the session doc.
  await db.collection('sessions').doc(sid).set({
    email,
    tier,
    role: input.role,
    ipHash: input.ip ? hashIp(input.ip) : null,
    issuedAt: Timestamp.fromMillis(Date.now()),
    revokedAt: null,
  });

  const token = await new SignJWT({
    sub: email,
    tier,
    role: input.role,
    sid,
    ver: tokenVersion,
    mfaEnrolled: input.mfaEnrolled === true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret);

  return {
    token,
    cookieName: cookieFor(tier),
    maxAge,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge },
    sid,
  };
}

/** Set secure=true when the request is HTTPS (prod) — call before cookies.set. */
export function withSecure(cookie: IssuedSession['cookie'], isSecure: boolean): IssuedSession['cookie'] {
  return { ...cookie, secure: isSecure };
}

export interface SessionUser {
  email: string;
  tier: Tier;
  role: Role;
  sid: string;
  permissions: Permission[];
}

export type VerifyResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Verify a session from the request cookies. Optionally require a permission.
 * Returns a ready 401/403 response on failure. This is the ONLY function
 * protected routes trust.
 */
export async function verifySession(
  request: Request,
  requiredPermission?: Permission,
  tier?: Tier
): Promise<VerifyResult> {
  const secret = getJwtSecret();
  if (!secret) {
    return { ok: false, response: NextResponse.json({ error: 'Server auth misconfigured (JWT_SECRET)' }, { status: 500 }) };
  }
  const db = getAdminDb();
  if (!db) {
    return { ok: false, response: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }) };
  }

  const cookieString = request.headers.get('cookie') || '';
  const candidates = tier ? [cookieFor(tier)] : [ADMIN_COOKIE, USER_COOKIE];
  let token: string | undefined;
  for (const name of candidates) {
    const row = cookieString.split('; ').find((r) => r.startsWith(`${name}=`));
    if (row) { token = row.split('=')[1]; break; }
  }
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  let payload: { sub: string; tier: Tier; role: Role; sid: string; ver: number };
  try {
    const { payload: p } = await jwtVerify(token, secret);
    payload = p as unknown as typeof payload;
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  // 1. Session doc exists + not revoked.
  let sessionSnap;
  try {
    sessionSnap = await db.collection('sessions').doc(payload.sid).get();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }) };
  }
  if (!sessionSnap.exists) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }
  const session = sessionSnap.data() as { email: string; tier: Tier; role: Role; revokedAt: Timestamp | null };
  if (session.revokedAt) {
    return { ok: false, response: NextResponse.json({ error: 'Session revoked' }, { status: 401 }) };
  }

  // 2. Account exists + active + tokenVersion matches.
  const col = session.tier === 'admin' ? 'admins' : 'users';
  let accSnap;
  try {
    accSnap = await db.collection(col).doc(session.email).get();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }) };
  }
  if (!accSnap.exists) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }
  const acc = accSnap.data() as {
    email: string; role: Role; status: 'active' | 'suspended'; tokenVersion: number;
    permissions?: Permission[]; emailVerified?: boolean;
  };
  if (acc.status !== 'active') {
    return { ok: false, response: NextResponse.json({ error: 'Account suspended' }, { status: 403 }) };
  }
  if (typeof acc.tokenVersion === 'number' && payload.ver !== acc.tokenVersion) {
    return { ok: false, response: NextResponse.json({ error: 'Session revoked' }, { status: 401 }) };
  }

  // 3. Email in JWT must match the session doc's email (anti-substitution).
  if (session.email !== payload.sub) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  // 4. Permission check against the ACCOUNT DOC role (authoritative).
  const effectiveRole = session.tier === 'admin' ? (acc.role ?? session.role) : 'viewer';
  const perms = permissionsForRole(effectiveRole);
  if (requiredPermission && !roleHasPermission(effectiveRole, requiredPermission)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return {
    ok: true,
    user: { email: session.email, tier: session.tier, role: effectiveRole, sid: payload.sid, permissions: perms },
  };
}

/** Convenience: require a permission or return the 403 response. */
export async function requirePermission(
  request: Request,
  perm: Permission,
  tier: Tier = 'admin'
): Promise<VerifyResult> {
  return verifySession(request, perm, tier);
}

/** Revoke a single session by sid. */
export async function revokeSession(sid: string): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  await db.collection('sessions').doc(sid).update({ revokedAt: Timestamp.fromMillis(Date.now()) });
}

/** Revoke ALL sessions for an account by bumping its tokenVersion ( + mark sessions revoked). */
export async function revokeAllSessionsForAccount(email: string, tier: Tier): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  const col = tier === 'admin' ? 'admins' : 'users';
  const e = email.toLowerCase().trim();
  // bump tokenVersion (invalidates all existing JWTs for this account)
  const ref = db.collection(col).doc(e);
  await ref.set({ tokenVersion: Date.now() }, { merge: true });
  // also mark existing session docs revoked
  try {
    const snaps = await db.collection('sessions').where('email', '==', e).where('tier', '==', tier).where('revokedAt', '==', null).get();
    const batch = db.batch();
    snaps.docs.forEach((d) => batch.update(d.ref, { revokedAt: Timestamp.fromMillis(Date.now()) }));
    await batch.commit();
  } catch (e2) {
    console.warn('[sessions] revoke batch failed:', e2 instanceof Error ? e2.message : e2);
  }
}

/** Clear the session cookie on a response. */
export function clearSessionCookie(response: NextResponse, tier: Tier): NextResponse {
  response.cookies.set(cookieFor(tier), '', { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
