"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import PushNotificationService from "@/services/PushNotificationService";

/**
 * Custom hook for managing push notifications
 * Provides state management and actions for notification functionality
 */
export default function useNotifications() {
  const { data: session, status } = useSession();

  // State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Check notification status on component mount and session change
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      status === "authenticated" &&
      session?.user?.id
    ) {
      initializeNotificationStatus();
      loadPreferences();
    }
  }, [session, status]);

  /**
   * Initialize notification permission and subscription status
   */
  const initializeNotificationStatus = useCallback(async () => {
    try {
      const currentPermission = PushNotificationService.getPermissionStatus();
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        const subscribed = await PushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error("Error initializing notification status:", error);
      setError(error.message);
    }
  }, []);

  /**
   * Load user notification preferences from server
   */
  const loadPreferences = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setPreferencesLoading(true);
      const response = await fetch("/api/notifications/preferences");

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        console.error("Failed to load notification preferences");
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Request notification permission from user
   */
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const granted = await PushNotificationService.requestPermission();
      const newPermission = granted ? "granted" : "denied";
      setPermission(newPermission);

      return granted;
    } catch (error) {
      console.error("Error requesting permission:", error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!session?.user?.id) {
      setError("User not authenticated");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure permission is granted first
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          setError("Permission not granted for notifications");
          return false;
        }
      }

      // Subscribe to push notifications
      await PushNotificationService.subscribe(session.user.id);
      setIsSubscribed(true);

      // Update preferences if they exist
      if (preferences) {
        await updatePreferences({ ...preferences, push_enabled: true });
      }

      return true;
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, permission, preferences, requestPermission]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!session?.user?.id) {
      setError("User not authenticated");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await PushNotificationService.unsubscribe(session.user.id);
      setIsSubscribed(false);

      // Update preferences if they exist
      if (preferences) {
        await updatePreferences({ ...preferences, push_enabled: false });
      }

      return true;
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, preferences]);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (newPreferences) => {
      if (!session?.user?.id) {
        setError("User not authenticated");
        return false;
      }

      try {
        setPreferencesLoading(true);
        setError(null);

        const response = await fetch("/api/notifications/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPreferences),
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update preferences");
        }
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        setError(error.message);
        return false;
      } finally {
        setPreferencesLoading(false);
      }
    },
    [session?.user?.id]
  );

  /**
   * Toggle specific preference
   */
  const togglePreference = useCallback(
    async (key, value) => {
      if (!preferences) return false;

      const newPreferences = { ...preferences, [key]: value };
      return await updatePreferences(newPreferences);
    },
    [preferences, updatePreferences]
  );

  /**
   * Check if notifications are supported
   */
  const isSupported = PushNotificationService.isNotificationSupported();

  /**
   * Test notification (for development/debugging)
   */
  const testNotification = useCallback(() => {
    if (permission === "granted") {
      PushNotificationService.testNotification(
        "This is a test notification from Arya Natural Farms!"
      );
    } else {
      setError("Permission required to show test notification");
    }
  }, [permission]);

  /**
   * Get browser info for debugging
   */
  const getBrowserInfo = useCallback(() => {
    return PushNotificationService.getBrowserInfo();
  }, []);

  /**
   * Refresh subscription status (useful after browser changes)
   */
  const refreshStatus = useCallback(async () => {
    await initializeNotificationStatus();
    await loadPreferences();
  }, [initializeNotificationStatus, loadPreferences]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isSubscribed,
    permission,
    loading,
    error,
    preferences,
    preferencesLoading,
    isSupported,
    isAuthenticated: status === "authenticated" && !!session?.user?.id,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    togglePreference,
    loadPreferences,
    testNotification,
    refreshStatus,
    clearError,

    // Utilities
    getBrowserInfo,

    // Computed values
    canSubscribe: isSupported && permission === "granted" && !isSubscribed,
    needsPermission: isSupported && permission === "default",
    isBlocked: permission === "denied",
    isReady: isSupported && permission === "granted" && isSubscribed,
  };
}
