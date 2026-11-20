import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secret MUST come from env (>= 32 chars). No insecure fallback.
// If missing/weak, verification is impossible → fail closed (401).
function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('JWT_SECRET is not configured or is too weak (min 32 characters).');
  }
  return new TextEncoder().encode(raw);
}

export async function GET(request: Request) {
  try {
    // Get token from cookie
    const cookieString = request.headers.get('cookie') || '';
    const token = cookieString
      .split('; ')
      .find(row => row.startsWith('qf_admin_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());

    return NextResponse.json({
      user: {
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }
}
