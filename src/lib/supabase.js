import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log configuration for debugging
console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl || 'not set',
  keyLength: supabaseAnonKey?.length || 0
});

let supabaseInstance = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    });
    console.log('Supabase client created successfully');
  } else {
    console.warn('Supabase environment variables are missing:', {
      url: !supabaseUrl ? 'missing' : 'present',
      key: !supabaseAnonKey ? 'missing' : 'present'
    });
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  supabaseInstance = null;
}

// Export the instance
export const supabase = supabaseInstance;