import { createClient } from "@supabase/supabase-js";
import { getSession } from "next-auth/react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client that bypasses RLS for NextAuth integration
export const createSupabaseClient = () => {
  console.log("🔧 Creating Supabase admin client:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey,
    willUseServiceKey: !!supabaseServiceKey,
  });

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error("❌ Supabase configuration missing:", {
      url: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey,
      anonKey: !!supabaseAnonKey,
    });
    throw new Error("Supabase configuration is missing");
  }

  const client = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  console.log("✅ Supabase admin client created successfully");
  return client;
};

// Helper function to get Supabase token from NextAuth session
export const getSupabaseToken = async () => {
  const session = await getSession();
  return session?.user?.id || null;
};
