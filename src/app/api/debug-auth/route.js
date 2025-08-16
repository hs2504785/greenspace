import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Test Supabase connection
    let supabaseTest = { connected: false, error: null };
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("users")
          .select("count", { count: "exact", head: true });
        supabaseTest.connected = !error;
        supabaseTest.error = error?.message || null;
        supabaseTest.userCount = data || "N/A";
      } else {
        supabaseTest.error = "Supabase client not initialized";
      }
    } catch (err) {
      supabaseTest.error = err.message;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
          ? `SET (${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...)`
          : "NOT SET",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
          ? "SET"
          : "NOT SET",
        NEXT_PUBLIC_SUPABASE_URL:
          process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "SET"
          : "NOT SET",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "SET"
          : "NOT SET",
      },
      computed: {
        baseUrl,
        expectedRedirectUri: `${baseUrl}/api/auth/callback/google`,
        NODE_ENV: process.env.NODE_ENV,
      },
      supabase: supabaseTest,
      googleOAuthUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.GOOGLE_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        baseUrl + "/api/auth/callback/google"
      )}&response_type=code&scope=openid%20email%20profile`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
