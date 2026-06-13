import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qf_secret_key_change_me_in_production'
);

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

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
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
