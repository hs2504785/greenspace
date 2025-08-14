"use client";

import { useVegetables } from "@/hooks/useVegetables";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VegetableFilters from "@/components/features/VegetableFilters";
import VegetableResults from "@/components/features/VegetableResults";
import VegetableCount from "@/components/features/VegetableCount";

export default function Home() {
  const { vegetables, loading, error, totalCount, filters, updateFilters } =
    useVegetables();

  return (
    <div className="container">
      <div className="py-2">
        <VegetableFilters
          filters={filters}
          onFilterChange={updateFilters}
          totalCount={totalCount}
        />
      </div>

      <div className="ui-scroll ui-scroll-lg">
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
