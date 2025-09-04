"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function useSellerRequestStatus() {
  const { data: session } = useSession();
  const [sellerRequest, setSellerRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      checkSellerRequestStatus();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const checkSellerRequestStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔍 useSellerRequestStatus: Fetching for user:",
        session.user.id
      );

      const response = await fetch(
        `/api/seller-requests?userId=${session.user.id}`
      );

      console.log("🔍 useSellerRequestStatus: API Response:", {
        ok: response.ok,
        status: response.status,
        url: response.url,
      });

      if (response.ok) {
        const requests = await response.json();
        console.log("🔍 useSellerRequestStatus: Received requests:", {
          count: requests.length,
          requests: requests,
          latestRequest: requests[0],
        });

        if (requests.length > 0) {
          // Get the latest request
          const latestRequest = requests[0];
          console.log("🔍 useSellerRequestStatus: Setting latest request:", {
            id: latestRequest.id,
            status: latestRequest.status,
            user_id: latestRequest.user_id,
          });
          setSellerRequest(latestRequest);
        } else {
          console.log(
            "🔍 useSellerRequestStatus: No requests found, setting null"
          );
          setSellerRequest(null);
        }
      } else {
        console.error(
          "Failed to fetch seller request status:",
          response.status
        );
        setError("Failed to check seller request status");
      }
    } catch (error) {
      console.error("Error checking seller request status:", error);
      setError("Error checking seller request status");
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    if (session?.user?.id) {
      checkSellerRequestStatus();
    }
  };

  const returnValue = {
    sellerRequest,
    loading,
    error,
    refreshStatus,
    hasPendingRequest: sellerRequest?.status === "pending",
    isApproved: sellerRequest?.status === "approved",
    isRejected: sellerRequest?.status === "rejected",
  };

  // Debug logging for return values
  React.useEffect(() => {
    console.log("🔍 useSellerRequestStatus: Return values:", returnValue);
  }, [sellerRequest, loading, error]);

  return returnValue;
}
