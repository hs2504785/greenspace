"use client";

import { useEnhancedVegetables } from "@/hooks/useEnhancedVegetables";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import VegetableFilterOffcanvas from "@/components/features/VegetableFilterOffcanvas";
import VegetableResults from "@/components/features/VegetableResults";
import { Alert, Button, Row, Col } from "react-bootstrap";
import { FaSync, FaInfoCircle } from "react-icons/fa";

export default function Home() {
  const searchParams = useSearchParams();
  const showFreeOnly = searchParams.get("showFreeOnly") === "true";
  const [showFilters, setShowFilters] = useState(false);

  const {
    vegetables,
    loading,
    error,
    stats,
    filters,
    updateFilters,
    refreshData,
    refreshExternalData,
    totalVegetables,
    internalProducts,
    externalProducts,
    hasFilters,
  } = useEnhancedVegetables({ showFreeOnly });

  // Update filter when URL parameter changes
  useEffect(() => {
    if (showFreeOnly !== filters.showFreeOnly) {
      updateFilters({ showFreeOnly });
    }
  }, [showFreeOnly, filters.showFreeOnly, updateFilters]);

  // Listen for ANY order events to refresh product listings (AI + Manual)
  useEffect(() => {
    const handleOrderEvent = (eventType) => {
      refreshData();
    };

    const handleOrderCreated = () => handleOrderEvent("Order created");
    const handleAIOrderCreated = () => handleOrderEvent("AI order created");
    const handleOrderCompleted = () => handleOrderEvent("Order completed");
    const handleProductsUpdated = () => handleOrderEvent("Products updated");

    if (typeof window !== "undefined") {
      // Listen for all possible order events
      window.addEventListener("order-created", handleOrderCreated); // Manual & AI orders
      window.addEventListener("ai-order-created", handleAIOrderCreated); // AI orders
      window.addEventListener("order-completed", handleOrderCompleted); // Fallback
      window.addEventListener("products-updated", handleProductsUpdated); // Product quantity updates

      return () => {
        window.removeEventListener("order-created", handleOrderCreated);
        window.removeEventListener("ai-order-created", handleAIOrderCreated);
        window.removeEventListener("order-completed", handleOrderCompleted);
        window.removeEventListener("products-updated", handleProductsUpdated);
      };
    }
  }, [refreshData]);

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

  // Listen for search events from header
  useEffect(() => {
    const handleVegetableSearch = (event) => {
      const query = event.detail?.query || "";
      updateFilters({ searchQuery: query });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("vegetable-search", handleVegetableSearch);
      return () => {
        window.removeEventListener("vegetable-search", handleVegetableSearch);
      };
    }
  }, [updateFilters]);

  return (
    <>
      <div className="container">
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
          stats={stats}
        />

        {/* Products Info Footer - Subtle stats at bottom */}
        {externalProducts > 0 && vegetables.length > 0 && (
          <div className="mt-4 p-3 bg-light rounded-3 text-center">
            <small className="text-muted">
              <FaInfoCircle className="me-1" />
              Showing {totalVegetables} products ({internalProducts} from our
              farmers + {externalProducts} from community sellers)
            </small>
          </div>
        )}
      </div>

      {/* Filter Offcanvas */}
      <VegetableFilterOffcanvas
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={updateFilters}
        totalCount={totalVegetables}
        stats={stats}
      />
    </>
  );
}
