import Google from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!supabase) return true;
      
      try {
        // Check if user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking user:', fetchError);
          return false;
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              provider: account.provider,
              role: 'consumer'
            }]);

          if (insertError) {
            console.error('Error creating user:', insertError);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return true; // Allow signin even if database operation fails
      }
    },
    async session({ session, token }) {
      console.log('🔄 Session callback triggered for:', session.user?.email);
      
      if (!supabase || !session.user?.email) {
        console.log('⚠️ No supabase or email, returning session as-is');
        return session;
      }

      try {
        console.log('📡 Fetching user from database for email:', session.user.email);
        // Get user ID from database
        const { data: user, error } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, role')
          .eq('email', session.user.email)
          .single();

        console.log('📥 Database response - user:', user, 'error:', error);

        if (!error && user) {
          console.log('✅ Adding user ID to session:', user.id);
          session.user.id = user.id;
          session.user.role = user.role;
        } else {
          console.log('❌ No user found or error occurred');
        }
      } catch (error) {
        console.error('Session callback error:', error);
      }

      console.log('🎯 Final session being returned:', session);
      return session;
    }
  }
};