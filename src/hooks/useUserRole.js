"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabaseAuth";

function useUserRole() {
  const { data: session } = useSession();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      // First check if role is already in session (from auth callback)
      if (session?.user?.role) {
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
          query = supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();
        } else if (session.user.email) {
          query = supabase
            .from("users")
            .select("role")
            .eq("email", session.user.email)
            .single();
        } else {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

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
    userRole: role, // Changed to match the destructured name in the payment page
    loading,
    isBuyer: role === "buyer",
    isSeller: role === "seller",
    isAdmin: role === "admin" || role === "superadmin",
    isSuperAdmin: role === "superadmin",
  };
}

export default useUserRole;
