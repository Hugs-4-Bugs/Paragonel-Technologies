import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

// Default credentials for testing purposes
const DEFAULT_ADMIN_EMAIL = 'admin@quantumfusion.in';
const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qf_secret_key_change_me_in_production'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH;

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
      .sign(JWT_SECRET);

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
