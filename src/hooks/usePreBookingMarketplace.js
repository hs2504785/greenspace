"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import vegetableService from "@/services/VegetableService";

export function usePreBookingMarketplace(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    harvest_season: "all",
    sort: "estimated_available_date", // Sort by availability date by default
    demand_level: "all",
    confidence_level: "all",
    ...initialFilters,
  });

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all vegetables and filter to prebooking products
      const data = await vegetableService.getAllVegetables();

      if (data && Array.isArray(data)) {
        // Filter to only prebooking products
        const prebookingProducts = data.filter(
          (product) => product.product_type === "prebooking"
        );

        setProducts(prebookingProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching prebooking products:", err);
      setError(err.message || "Failed to load prebooking products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort products based on current filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.location?.toLowerCase().includes(searchLower) ||
          product.owner?.toLowerCase().includes(searchLower) ||
          product.harvest_season?.toLowerCase().includes(searchLower) ||
          product.prebooking_notes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Harvest season filter
    if (filters.harvest_season !== "all") {
      filtered = filtered.filter(
        (product) => product.harvest_season === filters.harvest_season
      );
    }

    // Confidence level filter
    if (filters.confidence_level !== "all") {
      filtered = filtered.filter((product) => {
        const confidence = product.seller_confidence || 100;
        switch (filters.confidence_level) {
          case "high":
            return confidence >= 80;
          case "medium":
            return confidence >= 60 && confidence < 80;
          case "low":
            return confidence < 60;
          default:
            return true;
        }
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case "estimated_available_date":
          return (
            new Date(a.estimated_available_date || "9999-12-31") -
            new Date(b.estimated_available_date || "9999-12-31")
          );
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        case "confidence":
          return (b.seller_confidence || 100) - (a.seller_confidence || 100);
        case "alphabetical":
          return (a.name || "").localeCompare(b.name || "");
        case "newest":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters]);

  const totalCount = filteredProducts.length;

  const refresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products: filteredProducts,
    loading,
    error,
    totalCount,
    filters,
    updateFilters,
    refresh,
  };
}
