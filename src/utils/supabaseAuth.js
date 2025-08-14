import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client that bypasses RLS for NextAuth integration
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper function to get Supabase token from NextAuth session
export const getSupabaseToken = async () => {
  const session = await getSession();
  return session?.user?.id || null;
};