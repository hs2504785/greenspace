"use client";

import { useUserRole } from "@/hooks/useUserRole";
import LoadingSpinner from "./LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toastService from "@/utils/toastService";

export default function SellerGuard({ children }) {
  const { isSeller, isAdmin, loading } = useUserRole();
  const router = useRouter();

  const hasAccess = isSeller || isAdmin;

  useEffect(() => {
    if (!loading && !hasAccess) {
      toastService.presets.permissionDenied();
      router.push("/");
    }
  }, [loading, hasAccess, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    return null;
  }

  return children;
}
