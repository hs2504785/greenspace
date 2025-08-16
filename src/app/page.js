"use client";

import { useVegetables } from "@/hooks/useVegetables";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VegetableFilters from "@/components/features/VegetableFilters";
import VegetableResults from "@/components/features/VegetableResults";
import VegetableCount from "@/components/features/VegetableCount";

export default function Home() {
  const searchParams = useSearchParams();
  const showFreeOnly = searchParams.get("showFreeOnly") === "true";

  const {
    vegetables,
    loading,
    error,
    totalCount,
    filters,
    updateFilters,
    refresh,
  } = useVegetables({ showFreeOnly });

  // Update filter when URL parameter changes
  useEffect(() => {
    if (showFreeOnly !== filters.showFreeOnly) {
      updateFilters({ showFreeOnly });
    }
  }, [showFreeOnly, filters.showFreeOnly, updateFilters]);

  // Listen for order completion events to refresh product listings
  useEffect(() => {
    const handleOrderCompleted = () => {
      console.log("🔄 Order completed, refreshing vegetable listings...");
      refresh();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("order-completed", handleOrderCompleted);
      return () => {
        window.removeEventListener("order-completed", handleOrderCompleted);
      };
    }
  }, [refresh]);

  return (
    <div className="container">
      {vegetables.length > 0 && (
        <div className="py-3">
          <VegetableFilters
            filters={filters}
            onFilterChange={updateFilters}
            totalCount={totalCount}
          />
        </div>
      )}

      <VegetableResults
        vegetables={vegetables}
        loading={loading}
        error={error}
      />
    </div>
  );
}
