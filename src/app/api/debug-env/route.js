export async function GET(request) {
  console.log("🔧 Environment variables debug check...");

  const env = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,

    // Supabase Configuration
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
        : false,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..."
        : "not set",
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "..."
        : "not set",
    },

    // Google Auth Configuration
    google: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      secretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    },

    // NextAuth Configuration
    nextAuth: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasUrl: !!process.env.NEXTAUTH_URL,
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      url: process.env.NEXTAUTH_URL || "not set",
    },

    // Validation
    validation: {
      allSupabaseVarsPresent: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      allGoogleVarsPresent: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      allNextAuthVarsPresent: !!process.env.NEXTAUTH_SECRET,
      supabaseUrlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://") &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co")
        : false,
    },
  };

  // Check for common issues
  const issues = [];

  if (!env.supabase.hasUrl) {
    issues.push("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  } else if (!env.validation.supabaseUrlFormat) {
    issues.push(
      "NEXT_PUBLIC_SUPABASE_URL format appears invalid (should start with https:// and contain supabase.co)"
    );
  }

  if (!env.supabase.hasKey) {
    issues.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  } else if (env.supabase.keyLength < 100) {
    issues.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY appears too short (should be ~150+ characters)"
    );
  }

  if (!env.google.hasClientId) {
    issues.push("Missing GOOGLE_CLIENT_ID environment variable");
  }

  if (!env.google.hasClientSecret) {
    issues.push("Missing GOOGLE_CLIENT_SECRET environment variable");
  }

  if (!env.nextAuth.hasSecret) {
    issues.push("Missing NEXTAUTH_SECRET environment variable");
  }

  env.issues = issues;
  env.hasIssues = issues.length > 0;

  console.log("🔍 Environment check completed:", {
    hasIssues: env.hasIssues,
    issueCount: issues.length,
    issues,
  });

  return Response.json(env);
}
