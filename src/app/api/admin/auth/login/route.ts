import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

// Fail-closed helpers. Insecure code-level default credentials have been REMOVED.
// Admin login now REQUIRES environment configuration:
//   JWT_SECRET            (>= 32 chars, strong random)
//   ADMIN_EMAIL           (admin login email)
//   ADMIN_PASSWORD_HASH   (bcrypt hash of the admin password — NOT plaintext)
// If any are missing or weak, login is refused (503 / 500) — never falls back.
function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('JWT_SECRET is not configured or is too weak (min 32 characters).');
  }
  return new TextEncoder().encode(raw);
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // Fail closed: never allow login without configured credentials.
    if (!adminEmail || !adminPasswordHash) {
      return NextResponse.json(
        { message: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    const { email, password } = await request.json();

    if (email !== adminEmail) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({ email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(getJwtSecret());

    const response = NextResponse.json({ success: true });

    // Determine if we are in a secure environment
    const isSecure = request.url.startsWith('https');

    response.cookies.set('qf_admin_token', token, {
      httpOnly: true,
      secure: isSecure, // Only true if the request is https
      sameSite: 'lax', // 'lax' is more reliable than 'strict' across different tab/origin scenarios in dev
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
