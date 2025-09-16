"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ClientVegetableService from "@/services/ClientVegetableService";

export function useEnhancedVegetables(initialFilters = {}) {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [filters, setFilters] = useState({
    category: "All",
    location: "",
    searchQuery: "",
    showFreeOnly: false,
    includeExternal: true,
    sourceType: "all", // 'internal', 'external', 'all'
    minPrice: null,
    maxPrice: null,
    sortBy: "created_at",
    sortOrder: "desc",
    ...initialFilters,
  });

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const fetchVegetables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching vegetables with filters:", filters);

      // Use the client service to search with filters
      const data = await ClientVegetableService.searchVegetables({
        query: filters.searchQuery,
        category: filters.category,
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        showFreeOnly: filters.showFreeOnly,
        includeExternal: filters.includeExternal,
        sourceType: filters.sourceType,
      });

      // Apply sorting
      data.sort((a, b) => {
        let aValue, bValue;

        switch (filters.sortBy) {
          case "name":
            aValue = a.name?.toLowerCase() || "";
            bValue = b.name?.toLowerCase() || "";
            break;
          case "price":
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case "quantity":
            aValue = a.quantity || 0;
            bValue = b.quantity || 0;
            break;
          case "category":
            aValue = a.category?.toLowerCase() || "";
            bValue = b.category?.toLowerCase() || "";
            break;
          case "location":
            aValue = a.location?.toLowerCase() || "";
            bValue = b.location?.toLowerCase() || "";
            break;
          case "created_at":
          default:
            aValue = new Date(a.created_at || 0);
            bValue = new Date(b.created_at || 0);
            break;
        }

        if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      setVegetables(data);
      console.log(`✅ Loaded ${data.length} vegetables`);

      // Get stats
      const productStats = await ClientVegetableService.getProductStats();
      setStats(productStats);
    } catch (err) {
      console.error("❌ Error fetching vegetables:", err);
      setError(err.message || "Failed to load vegetables");
      setVegetables([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch data when filters change
  useEffect(() => {
    fetchVegetables();
  }, [fetchVegetables]);

  // Refresh external data
  const refreshExternalData = useCallback(async () => {
    try {
      setLoading(true);
      await ClientVegetableService.refreshExternalCache();
      await fetchVegetables();
    } catch (err) {
      console.error("❌ Error refreshing external data:", err);
      setError("Failed to refresh external data");
    }
  }, [fetchVegetables]);

  // Clear external cache
  const clearExternalCache = useCallback(() => {
    ClientVegetableService.clearExternalCache();
  }, []);

  // Computed values
  const computedData = useMemo(() => {
    const totalVegetables = vegetables.length;
    const availableVegetables = vegetables.filter((v) => v.quantity > 0).length;
    const outOfStockVegetables = totalVegetables - availableVegetables;
    const freeVegetables = vegetables.filter((v) => v.price === 0).length;

    // Separate internal and external
    const internalProducts = vegetables.filter((v) => !v.is_external);
    const externalProducts = vegetables.filter((v) => v.is_external);

    // Categories and locations
    const categories = [...new Set(vegetables.map((v) => v.category))].filter(
      Boolean
    );
    const locations = [...new Set(vegetables.map((v) => v.location))].filter(
      Boolean
    );

    // Price range
    const prices = vegetables.map((v) => v.price).filter((p) => p > 0);
    const priceRange =
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            average:
              prices.reduce((sum, price) => sum + price, 0) / prices.length,
          }
        : null;

    return {
      totalVegetables,
      availableVegetables,
      outOfStockVegetables,
      freeVegetables,
      internalProducts: internalProducts.length,
      externalProducts: externalProducts.length,
      categories,
      locations,
      priceRange,

      // Filter stats
      filteredCount: totalVegetables,
      hasFilters:
        filters.searchQuery ||
        filters.category !== "All" ||
        filters.location ||
        filters.showFreeOnly ||
        filters.minPrice !== null ||
        filters.maxPrice !== null ||
        filters.sourceType !== "all",
    };
  }, [vegetables, filters]);

  // Get specific vegetable by ID
  const getVegetableById = useCallback(async (id) => {
    try {
      return await ClientVegetableService.getVegetableById(id);
    } catch (err) {
      console.error("❌ Error getting vegetable:", err);
      return null;
    }
  }, []);

  // Get available categories
  const getCategories = useCallback(async () => {
    try {
      return await ClientVegetableService.getCategories();
    } catch (err) {
      console.error("❌ Error getting categories:", err);
      return [];
    }
  }, []);

  // Get available locations
  const getLocations = useCallback(async () => {
    try {
      return await ClientVegetableService.getLocations();
    } catch (err) {
      console.error("❌ Error getting locations:", err);
      return [];
    }
  }, []);

  return {
    // Data
    vegetables,
    loading,
    error,
    stats,

    // Computed data
    ...computedData,

    // Filters
    filters,
    updateFilters,

    // Actions
    refreshData: fetchVegetables,
    refreshExternalData,
    clearExternalCache,
    getVegetableById,
    getCategories,
    getLocations,

    // State setters (for manual updates)
    setVegetables,
    setLoading,
    setError,
  };
}
