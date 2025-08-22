"use client";

import { useVegetables } from "@/hooks/useVegetables";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import VegetableFilterOffcanvas from "@/components/features/VegetableFilterOffcanvas";
import VegetableResults from "@/components/features/VegetableResults";

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

  // Listen for ANY order events to refresh product listings (AI + Manual)
  useEffect(() => {
    const handleOrderEvent = (eventType) => {
      console.log(
        `🔄 ${eventType} event received - refreshing vegetable listings...`
      );
      refresh();
    };

    const handleOrderCreated = () => handleOrderEvent("Order created");
    const handleAIOrderCreated = () => handleOrderEvent("AI order created");
    const handleOrderCompleted = () => handleOrderEvent("Order completed");

    if (typeof window !== "undefined") {
      console.log(
        "🎧 Setting up ALL order event listeners for vegetable refresh..."
      );

      // Listen for all possible order events
      window.addEventListener("order-created", handleOrderCreated); // Manual & AI orders
      window.addEventListener("ai-order-created", handleAIOrderCreated); // AI orders
      window.addEventListener("order-completed", handleOrderCompleted); // Fallback

      return () => {
        window.removeEventListener("order-created", handleOrderCreated);
        window.removeEventListener("ai-order-created", handleAIOrderCreated);
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
