"use client";

import { useVegetables } from "@/hooks/useVegetables";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VegetableFilterOffcanvas from "@/components/features/VegetableFilterOffcanvas";
import VegetableResults from "@/components/features/VegetableResults";
import VegetableCount from "@/components/features/VegetableCount";

export default function Home() {
  const searchParams = useSearchParams();
  const showFreeOnly = searchParams.get("showFreeOnly") === "true";
  const [showFilters, setShowFilters] = useState(false);

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

  // Listen for filter toggle events from header
  useEffect(() => {
    const handleToggleFilters = () => {
      setShowFilters(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("toggle-vegetable-filters", handleToggleFilters);
      return () => {
        window.removeEventListener(
          "toggle-vegetable-filters",
          handleToggleFilters
        );
      };
    }
  }, []);

  return (
    <>
      <div className="container">
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
        />
      </div>

      {/* Filter Offcanvas */}
      <VegetableFilterOffcanvas
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={updateFilters}
        totalCount={totalCount}
      />
    </>
  );
}
