import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  try {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/callback/google'
    );

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email']
    });

    return NextResponse.json({
      success: true,
      url,
      config: {
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        googleIdLength: process.env.GOOGLE_CLIENT_ID?.length,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        googleSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
        redirectUri: 'http://localhost:3000/api/auth/callback/google'
      }
    });
  } catch (error) {
    console.error('Google OAuth test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
