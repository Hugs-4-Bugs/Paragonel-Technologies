import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quantumfusion.in';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qf_secret_key_change_me_in_production'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({ email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set('qf_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
