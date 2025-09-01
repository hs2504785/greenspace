import { useState, useEffect, useCallback, useMemo } from "react";
import toastService from "@/utils/toastService";

export function useUserVegetables(userId, initialFilters = {}) {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    category: null,
    location: null,
    searchQuery: "",
    sortBy: "created_at",
    sortDirection: "desc",
    productType: "regular",
    showFreeOnly: false,
    ...initialFilters,
  });

  const fetchVegetables = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.category && filters.category !== "All") {
        params.append("category", filters.category);
      }
      if (filters.searchQuery) {
        params.append("search", filters.searchQuery);
      }
      if (filters.productType) {
        params.append("productType", filters.productType);
      }

      const response = await fetch(`/api/users/${userId}/vegetables?${params}`);
      if (!response.ok) throw new Error("Failed to fetch user vegetables");

      const data = await response.json();
      let vegetables = data.vegetables || [];

      // Apply client-side filters that aren't handled by the API
      if (filters.location) {
        vegetables = vegetables.filter((v) =>
          v.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.showFreeOnly) {
        vegetables = vegetables.filter((v) => Number(v.price) === 0);
      }

      // Apply sorting
      vegetables.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        const direction = filters.sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "string") {
          return direction * aValue.localeCompare(bValue);
        }
        return direction * (aValue - bValue);
      });

      setVegetables(vegetables);
      setTotalCount(vegetables.length);
      setTotalPages(1);
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch user vegetables";
      console.error("Fetch user vegetables error:", {
        message: errorMessage,
        error: err,
        userId,
      });
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    fetchVegetables();
  }, [fetchVegetables]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const refresh = useCallback(() => {
    fetchVegetables();
  }, [fetchVegetables]);

  return {
    vegetables,
    loading,
    error,
    totalCount,
    totalPages,
    filters,
    updateFilters,
    refresh,
  };
}
