"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function TreesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tree management page
    router.replace("/tree-management");
  }, [router]);

  return <LoadingSpinner />;
}
