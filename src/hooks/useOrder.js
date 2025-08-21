"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import OrderService from "@/services/OrderService";
import toastService from "@/utils/toastService";
import { supabase } from "@/lib/supabase";

export function useOrder(orderId) {
  const { data: session } = useSession();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      // Prevent infinite loops - only attempt once per order ID
      if (fetchAttempted) {
        console.log(
          `🔄 Skipping refetch for order ${orderId} - already attempted`
        );
        return;
      }
      if (!orderId) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setFetchAttempted(true); // Mark as attempted to prevent retries

        console.log("Fetching order:", orderId);
        const data = await OrderService.getOrderById(orderId);
        console.log("Fetched order data:", data);

        if (!data) {
          console.log("No order data found");
          setError("Order not found");
          return;
        }

        // For mock data or initial testing, skip permission check
        if (!supabase) {
          console.log("Using mock data, skipping permission check");
          setOrder(data);
          return;
        }

        // Only check permissions if we have a session and are using Supabase
        if (session?.user?.id) {
          if (
            data.user_id !== session.user.id &&
            data.seller_id !== session.user.id
          ) {
            setError("You do not have permission to view this order");
            return;
          }
        }

        setOrder(data);
      } catch (err) {
        console.error("Error in useOrder hook:", err);

        // Handle "not found" errors more gracefully
        if (
          err.code === "ORDER_NOT_FOUND" ||
          err.message.includes("not found")
        ) {
          console.log(`👻 Order ${orderId} not found - likely old/invalid ID`);
          setError("Order not found");
          // Don't show toast for not found errors (too noisy)
        } else {
          setError("Failed to load order details");
          toastService.error("Failed to load order details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, session, fetchAttempted]);

  // Reset fetch attempt flag when orderId changes
  useEffect(() => {
    setFetchAttempted(false);
    setLoading(true);
    setError(null);
    setOrder(null);
  }, [orderId]);

  return { order, loading, error };
}
