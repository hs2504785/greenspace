"use client";

import useUserRole from "@/hooks/useUserRole";
import LoadingSpinner from "./LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toastService from "@/utils/toastService";

export default function AdminGuard({ children, requiredRole = "admin" }) {
  const { isAdmin, isSuperAdmin, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requiredRole === "superadmin" && !isSuperAdmin) {
        toastService.presets.permissionDenied();
        router.push("/");
      } else if (requiredRole === "admin" && !isAdmin) {
        toastService.presets.permissionDenied();
        router.push("/");
      }
    }
  }, [loading, isAdmin, isSuperAdmin, requiredRole, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (requiredRole === "superadmin" && !isSuperAdmin) {
    return null;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return null;
  }

  return children;
}
