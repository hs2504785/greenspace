"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export function useUserRole() {
  const { data: session } = useSession();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      // Debug: Log what we have in the session
      console.log("🔍 useUserRole - session data:", {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionRole: session?.user?.role,
        userName: session?.user?.name,
      });

      // First check if role is already in session (from auth callback)
      if (session?.user?.role) {
        console.log("✅ Using role from session:", session.user.role);
        setRole(session.user.role);
        setLoading(false);
        return;
      }

      // If no session user, set to null
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseClient();
        let query;

        // Use ID if available, otherwise fall back to email
        if (session.user.id) {
          console.log("🔍 Querying by user ID:", session.user.id);
          query = supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();
        } else if (session.user.email) {
          console.log("🔍 Querying by user email:", session.user.email);
          query = supabase
            .from("users")
            .select("role")
            .eq("email", session.user.email)
            .single();
        } else {
          console.log("❌ No user ID or email available");
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) {
          console.error("Database query error:", error);
          throw error;
        }

        console.log("✅ Role fetched from database:", data?.role);
        setRole(data?.role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [session]);

  return {
    role,
    loading,
    isBuyer: role === "buyer",
    isSeller: role === "seller",
    isAdmin: role === "admin" || role === "superadmin",
    isSuperAdmin: role === "superadmin",
  };
}
