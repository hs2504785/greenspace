"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";

export function useOrders(initialFilters = {}) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    period: "all",
    searchQuery: "",
    ...initialFilters,
  });

  const fetchOrders = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let data = await OrderService.getOrdersByUser(session.user.id);

      // Apply filters
      if (filters.status && filters.status !== "all") {
        data = data.filter((order) => order.status === filters.status);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        data = data.filter(
          (order) =>
            order.id.toLowerCase().includes(query) ||
            order.seller?.name?.toLowerCase().includes(query) ||
            order.items?.some((item) =>
              item.vegetable?.name?.toLowerCase().includes(query)
            )
        );
      }

      // Apply time period filter
      if (filters.period !== "all") {
        const now = new Date();

        switch (filters.period) {
          case "today":
            data = data.filter(
              (order) =>
                new Date(order.created_at).toDateString() === now.toDateString()
            );
            break;
          case "week":
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            data = data.filter(
              (order) => new Date(order.created_at) >= weekAgo
            );
            break;
          case "month":
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            data = data.filter(
              (order) => new Date(order.created_at) >= monthAgo
            );
            break;
          case "3months":
            const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
            data = data.filter(
              (order) => new Date(order.created_at) >= threeMonthsAgo
            );
            break;
          case "year":
            const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            data = data.filter(
              (order) => new Date(order.created_at) >= yearAgo
            );
            break;
        }
      }

      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
      toastService.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [session, filters]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, fetchOrders]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  return {
    orders,
    loading,
    error,
    filters,
    updateFilters,
    totalCount: orders.length,
    refresh: fetchOrders,
  };
}
