"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { useRouter } from "next/navigation";
import toastService from "@/utils/toastService";

/**
 * Custom hook for admin authentication with caching
 * Reduces database calls by caching the admin status
 */
export function useAuthenticatedAdmin() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // Cache admin status in sessionStorage to avoid repeated DB calls
  const checkAdminStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return false;
    }

    try {
      // Check cache first
      const cacheKey = `admin_status_${session.user.id}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const { role, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          const adminStatus = role === "admin" || role === "superadmin";
          setIsAdmin(adminStatus);
          setUserRole(role);
          setLoading(false);
          return adminStatus;
        }
      }

      // Fetch from database if not cached or cache expired
      const supabase = createSupabaseClient();
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      const role = userData?.role;
      const adminStatus = role === "admin" || role === "superadmin";

      // Cache the result
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          role,
          timestamp: Date.now(),
        })
      );

      setIsAdmin(adminStatus);
      setUserRole(role);
      setLoading(false);

      return adminStatus;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setLoading(false);
      return false;
    }
  }, [session]);

  // Verify admin access and redirect if unauthorized
  const verifyAdminAccess = useCallback(async () => {
    const adminStatus = await checkAdminStatus();

    if (!adminStatus && !loading) {
      toastService.presets.permissionDenied();
      router.push("/");
      return false;
    }

    return adminStatus;
  }, [checkAdminStatus, loading, router]);

  // Clear cache when user changes
  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
    } else {
      // Clear cache when user logs out
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("admin_status_"))
        .forEach((key) => sessionStorage.removeItem(key));

      setIsAdmin(false);
      setUserRole(null);
      setLoading(false);
    }
  }, [session, checkAdminStatus]);

  return {
    isAdmin,
    userRole,
    loading,
    verifyAdminAccess,
    checkAdminStatus,
  };
}
