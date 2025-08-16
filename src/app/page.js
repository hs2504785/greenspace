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

  const { vegetables, loading, error, totalCount, filters, updateFilters } =
    useVegetables({ showFreeOnly });

  // Update filter when URL parameter changes
  useEffect(() => {
    if (showFreeOnly !== filters.showFreeOnly) {
      updateFilters({ showFreeOnly });
    }
  }, [showFreeOnly, filters.showFreeOnly, updateFilters]);

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

      <div
        className={`ui-scroll ${vegetables.length > 0 ? "ui-scroll-lg" : ""}`}
      >
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
