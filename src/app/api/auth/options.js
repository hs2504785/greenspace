import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import OtpService from "@/services/OtpService";

export const authOptions = {
  debug: true, // Enable debug logs
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      id: "mobile",
      name: "Mobile Number",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otpCode: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phoneNumber || !credentials?.otpCode) {
            throw new Error("Phone number and OTP are required");
          }

          // Verify OTP
          const result = await OtpService.verifyOtp(
            credentials.phoneNumber,
            credentials.otpCode
          );

          if (!result.success) {
            throw new Error("Invalid OTP");
          }

          const phoneNumber = result.phoneNumber;

          // Check if user exists with this phone number
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("phone_number", phoneNumber)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error checking user:", fetchError);
            throw new Error("Database error");
          }

          let user;
          if (existingUser) {
            // Return existing user
            user = existingUser;
          } else {
            // Create new user with phone number
            const { data: newUser, error: insertError } = await supabase
              .from("users")
              .insert([
                {
                  phone_number: phoneNumber,
                  whatsapp_number: phoneNumber, // Assume WhatsApp number is same as phone
                  name: `User ${phoneNumber.slice(-4)}`, // Default name with last 4 digits
                  provider: "mobile",
                  role: "buyer",
                },
              ])
              .select()
              .single();

            if (insertError) {
              console.error("Error creating user:", insertError);
              throw new Error("Failed to create user");
            }

            user = newUser;
          }

          // Return user object for NextAuth
          return {
            id: user.id,
            name: user.name,
            email: user.email || null,
            phone: user.phone_number,
            whatsappNumber: user.whatsapp_number,
            role: user.role,
            provider: "mobile",
          };
        } catch (error) {
          console.error("Mobile auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, add user information to token
      if (user) {
        console.log("🔄 JWT callback - storing user in token:", user);
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.whatsappNumber = user.whatsappNumber;
        token.provider = user.provider;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log("🔐 SignIn callback triggered:", {
        provider: account?.provider,
        userEmail: user?.email,
        hasSupabase: !!supabase,
        profile: profile,
      });

      // Skip mobile auth - handled in the provider
      if (account?.provider === "mobile") {
        return true;
      }

      if (!supabase) {
        console.warn(
          "⚠️ Supabase not available, but allowing sign-in to proceed"
        );
        return true;
      }

      try {
        // Handle Google authentication
        if (account?.provider === "google") {
          // Check if user exists in database by email
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .eq("email", user.email)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error checking user:", fetchError);
            console.warn(
              "Allowing sign-in despite database error to prevent AccessDenied"
            );
            // Don't return false - allow auth to proceed
          }

          // If user doesn't exist, create them
          if (!existingUser) {
            const { error: insertError } = await supabase.from("users").insert([
              {
                email: user.email,
                name: user.name,
                avatar_url: user.image,
                provider: account.provider,
                role: "buyer",
              },
            ]);

            if (insertError) {
              console.error("Error creating user:", insertError);
              console.warn(
                "⚠️ Failed to create user in database, but allowing sign-in to prevent AccessDenied"
              );
              return true; // Don't block auth due to database creation failure
            }
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return true; // Allow signin even if database operation fails
      }
    },
    async session({ session, token }) {
      console.log(
        "🔄 Session callback triggered for user:",
        session?.user?.email
      );
      console.log("🔍 Token data:", { id: token?.id, email: token?.email });

      if (!supabase) {
        console.log("⚠️ No supabase, returning session as-is");
        return session;
      }

      try {
        // For Google users, search by email
        if (session.user?.email) {
          console.log("📧 Searching for user by email:", session.user.email);

          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email)
            .single();

          console.log("📥 Database query result:", { userData, error });

          if (!error && userData) {
            console.log("✅ Found user in database:", userData.id);
            // Populate session with database user data
            session.user.id = userData.id;
            session.user.role = userData.role || "user";
            session.user.phone = userData.phone;
            session.user.whatsappNumber = userData.whatsapp_number;
            session.user.location = userData.location;

            console.log("✅ Session populated with user data:", {
              id: session.user.id,
              email: session.user.email,
              role: session.user.role,
            });
          } else {
            console.log(
              "❌ User not found in database - should have been created in signIn callback"
            );
            // Don't create user here - it should be created in signIn callback
            // Just use basic session data
            session.user.role = "user";
          }
        } else {
          console.log("❌ No email in session user");
        }
      } catch (error) {
        console.error("💥 Session callback error:", error);
      }

      console.log("🎯 Final session being returned:", {
        hasUser: !!session.user,
        hasId: !!session.user?.id,
        email: session.user?.email,
        id: session.user?.id,
      });

      return session;
    },
  },
};
