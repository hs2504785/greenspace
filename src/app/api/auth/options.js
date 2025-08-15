import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import OtpService from "@/services/OtpService";

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
      if (!supabase) return true;

      try {
        // Skip database operations for mobile auth as it's handled in the provider
        if (account?.provider === "mobile") {
          return true;
        }

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
            return false;
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
              return false;
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
      console.log("🔄 Session callback triggered for user:", session.user);
      console.log("🔍 Token data:", token);

      if (!supabase) {
        console.log("⚠️ No supabase, returning session as-is");
        return session;
      }

      try {
        // If we have user data in the token (from JWT callback), use it directly
        if (token.id && token.provider === "mobile") {
          console.log("📱 Using mobile user data from token");
          session.user.id = token.id;
          session.user.role = token.role;
          session.user.phone = token.phone;
          session.user.whatsappNumber = token.whatsappNumber;
          session.user.provider = token.provider;

          console.log(
            "✅ Mobile user session populated from token:",
            session.user.id
          );
          console.log("🎯 Final session being returned:", session);
          return session;
        }

        let user = null;

        // For mobile users, we need to find them by name pattern or phone
        // Since mobile users are created as "User XXXX" where XXXX is last 4 digits of phone
        if (!session.user?.email && session.user?.name?.startsWith("User ")) {
          console.log("📱 Detected mobile user, searching by name pattern");

          // Extract last 4 digits from name
          const nameMatch = session.user.name.match(/User (\d{4})$/);
          if (nameMatch) {
            const lastFourDigits = nameMatch[1];

            // Search for users with phone numbers ending in these digits
            const { data: userData, error } = await supabase
              .from("users")
              .select(
                "id, name, email, avatar_url, role, phone_number, whatsapp_number, provider"
              )
              .eq("provider", "mobile")
              .like("phone_number", `%${lastFourDigits}`)
              .single();

            if (!error && userData) {
              user = userData;
              console.log("📱 Found mobile user by phone pattern:", userData);
            }
          }

          // Fallback: search by exact name match
          if (!user) {
            const { data: userData, error } = await supabase
              .from("users")
              .select(
                "id, name, email, avatar_url, role, phone_number, whatsapp_number, provider"
              )
              .eq("name", session.user.name)
              .eq("provider", "mobile")
              .single();

            if (!error && userData) {
              user = userData;
              console.log("📱 Found mobile user by name:", userData);
            }
          }
        }
        // For Google users, search by email
        else if (session.user?.email) {
          console.log(
            "📧 Fetching email user from database for:",
            session.user.email
          );

          const { data: userData, error } = await supabase
            .from("users")
            .select(
              "id, name, email, avatar_url, role, phone_number, whatsapp_number, provider"
            )
            .eq("email", session.user.email)
            .single();

          if (!error && userData) {
            user = userData;
          }
        }

        console.log("📥 Database response - user:", user);

        if (user) {
          console.log("✅ Adding user data to session:", user.id);
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.phone = user.phone_number;
          session.user.whatsappNumber = user.whatsapp_number;
          session.user.provider = user.provider;

          // For mobile users, ensure name is set
          if (!session.user.name && user.name) {
            session.user.name = user.name;
          }
        } else {
          console.log("❌ No user found in database");

          // For debugging: show what we tried to search for
          if (!session.user?.email && session.user?.name?.startsWith("User ")) {
            console.log(
              "🔍 Mobile user search failed for name:",
              session.user.name
            );
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }

      console.log("🎯 Final session being returned:", session);
      return session;
    },
  },
};
