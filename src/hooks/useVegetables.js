import { useState, useEffect, useCallback, useMemo } from "react";
import VegetableService from "@/services/VegetableService";
import toastService from "@/utils/toastService";
// import { mockVegetables } from '@/data/mockVegetables'; // Removed - no longer using mock data

export function useVegetables(initialFilters = {}) {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: null,
    location: null,
    searchQuery: "",
    sortBy: "created_at",
    sortDirection: "desc",
    showFreeOnly: false,
    ...initialFilters,
  });

  const fetchVegetables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data = await VegetableService.getAllVegetables();

      // Apply filters to data
      if (filters.category && filters.category !== "All") {
        data = data.filter(
          (v) => v.category.toLowerCase() === filters.category.toLowerCase()
        );
      }
      if (filters.location) {
        data = data.filter((v) =>
          v.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        data = data.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.description.toLowerCase().includes(query) ||
            v.category.toLowerCase().includes(query) ||
            v.location.toLowerCase().includes(query)
        );
      }
      if (filters.showFreeOnly) {
        data = data.filter((v) => Number(v.price) === 0);
      }

      // Apply sorting
      data.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        const direction = filters.sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "string") {
          return direction * aValue.localeCompare(bValue);
        }
        return direction * (aValue - bValue);
      });

      // Apply pagination
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedData = data.slice(startIndex, endIndex);

      setVegetables(paginatedData);
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / filters.limit));
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch vegetables";
      console.error("Fetch vegetables error:", {
        message: errorMessage,
        error: err,
      });
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVegetables();
  }, [fetchVegetables]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change
      page: newFilters.page || 1,
    }));
  }, []);

  const createVegetable = async (data) => {
    try {
      if (!VegetableService) {
        toastService.error("Database not configured");
        return null;
      }
      const result = await VegetableService.createVegetable(data);
      toastService.success("Vegetable created successfully");
      return result;
    } catch (err) {
      toastService.error("Failed to create vegetable");
      throw err;
    }
  };

  const updateVegetable = async (id, data) => {
    try {
      if (!VegetableService) {
        toastService.error("Database not configured");
        return null;
      }
      const result = await VegetableService.updateVegetable(id, data);
      toastService.success("Vegetable updated successfully");
      return result;
    } catch (err) {
      toastService.error("Failed to update vegetable");
      throw err;
    }
  };

  const deleteVegetable = async (id) => {
    try {
      if (!VegetableService) {
        toastService.error("Database not configured");
        return false;
      }
      await vegetableService.deleteVegetable(id);
      toastService.success("Vegetable deleted successfully");
      fetchVegetables(); // Refresh the list
      return true;
    } catch (err) {
      toastService.error("Failed to delete vegetable");
      throw err;
    }
  };

  const uploadImage = async (file) => {
    try {
      if (!VegetableService) {
        toastService.error("Database not configured");
        return null;
      }
      return await vegetableService.uploadImage(file);
    } catch (err) {
      toastService.error("Failed to upload image");
      throw err;
    }
  };

  // Memoize the filters object to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.page,
      filters.limit,
      filters.category,
      filters.location,
      filters.searchQuery,
      filters.sortBy,
      filters.sortDirection,
      filters.showFreeOnly,
    ]
  );

  // Memoize the return object to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      vegetables,
      loading,
      error,
      totalPages,
      totalCount,
      filters: memoizedFilters,
      updateFilters,
      createVegetable,
      updateVegetable,
      deleteVegetable,
      uploadImage,
      refresh: fetchVegetables,
    }),
    [
      vegetables,
      loading,
      error,
      totalPages,
      totalCount,
      memoizedFilters,
      updateFilters,
      createVegetable,
      updateVegetable,
      deleteVegetable,
      uploadImage,
      fetchVegetables,
    ]
  );

  return returnValue;
}
