import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, environment variables might not be available
// Only log in development or when variables are actually available
if (typeof window !== "undefined" || supabaseUrl) {
  console.log("Supabase Configuration:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl || "not set",
    keyLength: supabaseAnonKey?.length || 0,
  });
}

let supabaseInstance = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
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
    if (
      typeof window !== "undefined" ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("Supabase client created successfully");
    }
  } else if (
    process.env.NODE_ENV !== "production" ||
    typeof window !== "undefined"
  ) {
    console.warn("Supabase environment variables are missing:", {
      url: !supabaseUrl ? "missing" : "present",
      key: !supabaseAnonKey ? "missing" : "present",
    });
  }
} catch (error) {
  if (process.env.NODE_ENV !== "production" || typeof window !== "undefined") {
    console.error("Error initializing Supabase client:", error);
  }
  supabaseInstance = null;
}

// Export the instance - can be null during build time
export const supabase = supabaseInstance;
