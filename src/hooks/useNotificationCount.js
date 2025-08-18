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

    // Register message listener
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    // Listen for notification clicks to decrement count
    const handleNotificationClick = () => {
      if (unreadCount > 0) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("notification-clicked", handleNotificationClick);

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
      window.removeEventListener(
        "notification-clicked",
        handleNotificationClick
      );
    };
  }, [unreadCount]);

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
