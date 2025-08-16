"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";

export function useSellerOrders(initialFilters = {}) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    period: "all",
    ...initialFilters,
  });

  const fetchSellerOrders = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.warn("No user ID in session");
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log("Fetching seller orders for user:", session.user.id);
      let data = await OrderService.getOrdersBySeller(session.user.id);

      // Apply filters
      if (filters.status && filters.status !== "all") {
        data = data.filter((order) => order.status === filters.status);
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

      console.log("Filtered seller orders:", data?.length || 0);
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching seller orders:", err);
      setError(err.message || "Failed to fetch seller orders");
      toastService.error("Failed to load seller orders");
    } finally {
      setLoading(false);
    }
  }, [session, filters]);

  useEffect(() => {
    if (session) {
      fetchSellerOrders();
    }
  }, [session, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log("🚀 useSellerOrders: Starting order status update:", {
        orderId,
        newStatus,
      });
      setLoading(true);

      console.log(
        "📤 useSellerOrders: Calling OrderService.updateOrderStatus..."
      );
      await OrderService.updateOrderStatus(orderId, newStatus);

      console.log("✅ useSellerOrders: Order status updated successfully");
      toastService.success("Order status updated successfully");

      console.log("🔄 useSellerOrders: Refreshing orders...");
      // Refresh orders
      await fetchSellerOrders();
    } catch (err) {
      console.log(
        "❌ useSellerOrders: Error updating order status - DETAILED DEBUG:",
        {
          message: err.message,
          name: err.name,
          stack: err.stack,
          code: err.code || "No code",
          errorType: typeof err,
          errorConstructor: err.constructor.name,
          errorKeys: Object.keys(err),
          fullError: err,
          orderId,
          newStatus,
        }
      );

      console.error("Error updating order status:", err);
      toastService.error(
        `Failed to update order status: ${err.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    filters,
    updateFilters,
    updateOrderStatus,
    refreshOrders: fetchSellerOrders,
  };
}
