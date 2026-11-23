import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { checkSameOrigin, checkBodySize } from '@/lib/api-security';

// JWT secret MUST come from env (>= 32 chars). No insecure fallback.
// If missing/weak, no token can be verified → fail closed (redirect to login).
function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

// Public admin-area pages that do NOT require an authenticated admin session.
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/bootstrap', '/admin/accept-invite']);

function jsonRejection(status: number, message: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin page gate (/admin/**, except the public auth pages). A user-tier
  //    token, step-1 token, or legacy password-only JWT is NOT accepted. Data
  //    routes under /api/admin/** are gated by verifySession at the handler.
  if (pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.has(pathname)) {
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
      return NextResponse.next();
    } catch (error) {
      console.error('JWT Verification Failed:', error);
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('qf_admin_token');
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
  matcher: ['/admin/:path*', '/api/:path*'],
};
