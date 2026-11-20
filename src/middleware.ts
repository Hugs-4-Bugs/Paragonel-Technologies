import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secret MUST come from env (>= 32 chars). No insecure fallback.
// If missing/weak, no token can be verified → fail closed (redirect to login).
function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes, excluding /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
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
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      console.error('JWT Verification Failed:', error);
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('qf_admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
