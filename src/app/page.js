"use client";

import { useVegetables } from "@/hooks/useVegetables";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VegetableFilters from "@/components/features/VegetableFilters";
import VegetableResults from "@/components/features/VegetableResults";
import VegetableCount from "@/components/features/VegetableCount";

export default function Home() {
  const { vegetables, loading, error, totalCount, filters, updateFilters } =
    useVegetables();

  // Show filters only when:
  // 1. There are vegetables to filter, OR
  // 2. User has actively applied some search/filter (so they can clear it)
  const hasActiveFilters =
    (filters.searchQuery && filters.searchQuery.trim() !== "") ||
    (filters.category &&
      filters.category !== "All" &&
      filters.category !== null) ||
    (filters.location && filters.location.trim() !== "");

  const shouldShowFilters = vegetables.length > 0 || hasActiveFilters;

  return (
    <>
      {shouldShowFilters && (
        <div className="container">
          <div className="py-3">
            <VegetableFilters
              filters={filters}
              onFilterChange={updateFilters}
              totalCount={totalCount}
            />
          </div>
        </div>
      )}

      <div className="container ui-scroll ui-scroll-lg">
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
        />
      </div>
    </>
  );
}
