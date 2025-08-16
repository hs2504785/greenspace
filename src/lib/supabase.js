import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced debug logging for production troubleshooting
console.log("🔧 Supabase Configuration Debug:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "not set",
  keyStartsWith: supabaseAnonKey
    ? supabaseAnonKey.substring(0, 10) + "..."
    : "not set",
  keyLength: supabaseAnonKey?.length || 0,
  nodeEnv: process.env.NODE_ENV,
  isServer: typeof window === "undefined",
});

let supabaseInstance = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    // Validate URL format
    if (!supabaseUrl.startsWith("https://")) {
      throw new Error(
        `Invalid Supabase URL format: ${supabaseUrl.substring(0, 30)}...`
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "@aryanaturalfarms/web",
        },
      },
    });

    console.log("✅ Supabase client created successfully");

    // Test connection on server side
    if (typeof window === "undefined") {
      console.log("🔍 Testing Supabase connection...");
      // We'll test this in the API routes
    }
  } else {
    const missing = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    console.error(
      "❌ Missing Supabase environment variables:",
      missing.join(", ")
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
} catch (error) {
  console.error("💥 Error initializing Supabase client:", {
    message: error.message,
    stack: error.stack,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "undefined",
    keyLength: supabaseAnonKey?.length || 0,
  });
  supabaseInstance = null;
}

// Export the instance - can be null during build time
export const supabase = supabaseInstance;
