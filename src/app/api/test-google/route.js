import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

export async function GET(request) {
  try {
    // Get the base URL from the request
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
    });

    return NextResponse.json({
      success: true,
      url,
      config: {
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        googleIdLength: process.env.GOOGLE_CLIENT_ID?.length,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        googleSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
        redirectUri: redirectUri,
      },
    });
  } catch (error) {
    console.error("Google OAuth test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
