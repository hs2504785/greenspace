"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook to manage notification count and badge display
 */
export default function useNotificationCount() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load unread notification count
  const loadUnreadCount = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load count on session change
  useEffect(() => {
    if (session?.user?.id) {
      loadUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [session?.user?.id]);

  // Listen for new notifications from service worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleNewNotification = () => {
      console.log("🔔 Incrementing notification count");
      setUnreadCount((prev) => prev + 1);
    };

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event) => {
      console.log("📨 Received service worker message:", event.data);
      if (event.data?.type === "NEW_NOTIFICATION") {
        handleNewNotification();
      }
    };

    // Listen for manual increment events (for testing)
    const handleManualIncrement = () => {
      console.log("🧪 Manual notification count increment");
      setUnreadCount((prev) => prev + 1);
    };

    // Register message listener
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );
    }

    // Register manual increment listener for testing
    window.addEventListener(
      "manual-notification-increment",
      handleManualIncrement
    );

    // Listen for BroadcastChannel messages as fallback
    let broadcastChannel;
    try {
      broadcastChannel = new BroadcastChannel("notification-updates");
      broadcastChannel.addEventListener("message", (event) => {
        console.log("📻 Received BroadcastChannel message:", event.data);
        if (event.data?.type === "NEW_NOTIFICATION") {
          handleNewNotification();
        }
      });
      console.log("📻 BroadcastChannel listener registered");
    } catch (error) {
      console.warn("⚠️ BroadcastChannel not available:", error);
    }

    // Listen for notification clicks to decrement count
    const handleNotificationClick = () => {
      setUnreadCount((prev) => {
        if (prev > 0) {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    };

    window.addEventListener("notification-clicked", handleNotificationClick);

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
      }
      window.removeEventListener(
        "notification-clicked",
        handleNotificationClick
      );
      window.removeEventListener(
        "manual-notification-increment",
        handleManualIncrement
      );
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []); // Remove unreadCount dependency to prevent recreation of listeners

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const incrementCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  return {
    unreadCount,
    loading,
    loadUnreadCount,
    markAllAsRead,
    incrementCount,
  };
}
