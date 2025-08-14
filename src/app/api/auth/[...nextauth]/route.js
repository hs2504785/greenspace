import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.email_verified) {
        try {
          // First, sign in with Supabase
          const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: process.env.NEXTAUTH_URL
            }
          });

          if (authError) throw authError;

          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', profile.email)
            .single();

          if (!existingUser) {
            // Create new user
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                email: profile.email,
                name: profile.name,
                avatar_url: profile.picture,
                role: 'user'
              })
              .select()
              .single();

            if (error) throw error;
            console.log('Created new user:', newUser);
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // Get user from Supabase
        const { data: user } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', session.user.email)
          .single();

        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.accessToken = token.accessToken;
        }
      }
      return session;
    }
  },
  debug: true
});

export { handler as GET, handler as POST };