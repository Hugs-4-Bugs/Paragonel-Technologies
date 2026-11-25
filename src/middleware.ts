import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { checkSameOrigin, checkBodySize } from '@/lib/api-security';
import { canonicalHostRedirect } from '@/lib/canonical-host';
import { requiresAdminGate, requiresUserGate } from '@/lib/auth/page-gates';

// JWT secret MUST come from env (>= 32 chars). No insecure fallback.
// If missing/weak, no token can be verified → fail closed (redirect to login).
function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

// Page-gate path predicates (admin + candidate) live in the pure, tested
// src/lib/auth/page-gates.ts. Canonical-domain redirects (www.paragonel.com →
// apex) are decided by the pure, tested src/lib/canonical-host.ts.

function jsonRejection(status: number, message: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 0. Canonical-domain redirects — see src/lib/canonical-host.ts (tested).
  //    Only www.paragonel.com → apex; the Vercel preview host, the apex,
  //    localhost, + the AcquisitionOS hosts are never redirected.
  const canonical = canonicalHostRedirect(host, pathname, request.nextUrl.search);
  if (canonical) {
    return NextResponse.redirect(canonical.url, canonical.permanent ? 308 : 307);
  }

  // 1. Admin page gate (/admin/**, except the public auth pages). A user-tier
  //    token, step-1 token, or legacy password-only JWT is NOT accepted. Data
  //    routes under /api/admin/** are gated by verifySession at the handler.
  if (requiresAdminGate(pathname)) {
    const token = request.cookies.get('qf_admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const secret = getJwtSecret();
    if (!secret) {
      // Misconfigured: cannot verify any token → deny access.
      console.error('JWT_SECRET is not configured or is too weak (min 32 characters).');
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('qf_admin_token');
      return response;
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      // Page-gating requires an ADMIN-tier session (only issued after
      // password + OTP step-2). A user-tier token, a step-1 token, or a legacy
      // password-only JWT (no tier) is NOT accepted for /admin/** pages.
      // Data-route enforcement (revocation, suspension, permissions) is in
      // src/lib/auth/sessions.ts verifySession.
      if (payload.tier !== 'admin') {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('qf_admin_token');
        return response;
      }
      // Super-admin MFA enforcement (Phase 3, server-side/edge). A super_admin
      // whose session has mfaEnrolled !== true can ONLY access the enrollment
      // page + the enrollment APIs — every other admin page/API is blocked
      // until TOTP is enrolled. This prevents a super_admin from operating the
      // admin portal without MFA, even via a step-2 session obtained through
      // the first-login email-OTP path (allowed only BEFORE TOTP enrollment).
      // For /api/* paths, return 403 JSON (not a redirect) so API clients get a
      // clean error instead of an HTML page.
      const mfaEnrollExempt =
        pathname === '/admin/mfa-enroll' || pathname.startsWith('/api/admin/auth/mfa/');
      if (payload.role === 'super_admin' && payload.mfaEnrolled !== true && !mfaEnrollExempt) {
        if (pathname.startsWith('/api/')) {
          return jsonRejection(403, 'MFA enrollment required.');
        }
        return NextResponse.redirect(new URL('/admin/mfa-enroll', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      console.error('JWT Verification Failed:', error);
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('qf_admin_token');
      return response;
    }
  }

  // 1b. Candidate page gate (/candidate/** + /profile). A user-tier session is
  //     required. Data routes under /api/candidate/** are gated by verifySession
  //     at the handler; this gate prevents the unauthorized page shell from
  //     rendering (the client-side 401-redirect flash). The login redirect
  //     carries the original path so the user returns after authenticating.
  if (requiresUserGate(pathname)) {
    const token = request.cookies.get('qf_user_token')?.value;
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    if (!token) {
      return NextResponse.redirect(loginUrl);
    }

    const secret = getJwtSecret();
    if (!secret) {
      // Misconfigured: cannot verify any token → deny access (clear the cookie).
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('qf_user_token');
      return response;
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      // Page-gating requires a USER-tier session (candidate). An admin-tier
      // token is NOT accepted for /candidate/** pages (an admin is not a
      // candidate) — they are separate session types. Data-route enforcement
      // (revocation, suspension) is in src/lib/auth/sessions.ts verifySession.
      if (payload.tier !== 'user') {
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('qf_user_token');
        return response;
      }
      return NextResponse.next();
    } catch {
      // JWT verification failed (expired, tampered, or malformed). Do not log
      // the raw error (it may carry token fragments) — redirect to login.
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('qf_user_token');
      return response;
    }
  }

  // 2. API request security: coarse body-size guard + CSRF/origin protection
  //    for state-changing requests. Same-origin legitimate app requests
  //    (forms, fetch from the app shell, auth flows, token-gated POSTs) always
  //    carry an Origin/Referer or Sec-Fetch-Site signal and pass. Cross-site
  //    state-changing requests + obviously-huge payloads are rejected before
  //    the route handler runs. Read-only GET/HEAD/OPTIONS requests (health,
  //    token-unsubscribe links) are not checked.
  if (pathname.startsWith('/api/')) {
    const size = checkBodySize(request.headers);
    if (!size.ok) {
      return jsonRejection(413, 'Request body too large.');
    }
    const csrf = checkSameOrigin(request.method, request.headers);
    if (!csrf.ok) {
      return jsonRejection(403, 'Request not allowed from this origin.');
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals + static asset files, so the
  // acquisitionos.net host redirect (step 0) is evaluated on every page request.
  // The admin gate + API security (steps 1–2) still only act on /admin/** and
  // /api/** paths respectively — they are no-ops on other paths.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest|js|css|woff|woff2|ttf|map)$).*)',
  ],
};
