import { NextResponse } from 'next/server';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  console.error('Auth Error:', {
    error,
    params: Object.fromEntries(searchParams.entries()),
    env: {
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasUrl: !!process.env.NEXTAUTH_URL,
    }
  });

  return NextResponse.json({
    error,
    params: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });
}
