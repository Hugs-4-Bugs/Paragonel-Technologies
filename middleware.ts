import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qf_secret_key_change_me_in_production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes, excluding /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('qf_admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
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
