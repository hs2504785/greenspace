import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { authOptions } from '../[...nextauth]/route';

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

export async function POST(request) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    // Verify the user ID matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 403 });
    }

    // Create JWT token for Supabase
    const token = await new SignJWT({
      role: 'authenticated',
      sub: userId,
      aud: 'authenticated'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Supabase token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

