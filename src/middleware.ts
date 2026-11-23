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

/**
 * Canonical-domain decision for acquisitionos.net (Batch 3 Task 3). The `.net`
 * domain is NOT an approved AcquisitionOS destination — the only approved
 * destination is the private-beta site. If the `.net` host is ever pointed at
 * this app, permanently redirect it to the approved beta domain so the paragonel
 * site is never served under acquisitionos.net and the visitor lands on the real
 * product. This preserves the existing decision (forbidden in the AI system
 * prompt + hardcoded PRODUCT_DOMAIN on the AcquisitionOS page) at the redirect
 * layer too — the `.net` host can never become canonical.
 */
const ACQUISITIONOS_APPROVED_DOMAIN = 'https://acquisitionosbeta.vercel.app/';

function jsonRejection(status: number, message: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 0. Canonical-domain redirects.
  //    a) acquisitionos.net is NOT an approved destination → permanently
  //       redirect to the only approved AcquisitionOS host (the private-beta
  //       site). The paragonel site is never served under the .net host.
  //    b) www.paragonel.com → paragonel.com (apex). Canonical-domain
  //       consistency: the apex is the canonical host (matches metadataBase +
  //       sitemap/robots). Only fires if the www host is pointed at the app —
  //       the Vercel preview host (paragonel.vercel.app) is never redirected, so
  //       preview access is unaffected.
  if (host === 'acquisitionos.net' || host === 'www.acquisitionos.net') {
    return NextResponse.redirect(ACQUISITIONOS_APPROVED_DOMAIN, 308);
  }
  if (host === 'www.paragonel.com') {
    const apexUrl = new URL(pathname, 'https://paragonel.com');
    apexUrl.search = request.nextUrl.search;
    return NextResponse.redirect(apexUrl, 308);
  }

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
  // Run on all routes except Next.js internals + static asset files, so the
  // acquisitionos.net host redirect (step 0) is evaluated on every page request.
  // The admin gate + API security (steps 1–2) still only act on /admin/** and
  // /api/** paths respectively — they are no-ops on other paths.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest|js|css|woff|woff2|ttf|map)$).*)',
  ],
};
