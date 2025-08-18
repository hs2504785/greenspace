"use client";

/**
 * PushNotificationService
 * Handles client-side push notification functionality including:
 * - Permission requests
 * - Subscription management
 * - Service worker registration
 * - Browser compatibility checks
 */
class PushNotificationService {
  constructor() {
    this.isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }

  /**
   * Check if browser supports push notifications
   * @returns {boolean}
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   * @returns {string} 'granted', 'denied', 'default', or 'unsupported'
   */
  getPermissionStatus() {
    if (!this.isSupported) return "unsupported";
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error("Push notifications are not supported in this browser");
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Register service worker if not already registered
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  async registerServiceWorker() {
    if (!this.isSupported) {
      throw new Error("Service Worker not supported");
    }

    try {
      // Check if already registered
      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        // Register new service worker
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("Service Worker registered:", registration.scope);
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Subscribe user to push notifications
   * @param {string} userId - The user ID to associate with the subscription
   * @returns {Promise<PushSubscription>}
   */
  async subscribe(userId) {
    try {
      if (!this.isSupported) {
        throw new Error("Push notifications are not supported in this browser");
      }

      if (!this.vapidPublicKey) {
        throw new Error(
          "VAPID public key not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable."
        );
      }

      // Ensure permission is granted
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      // Register service worker
      const registration = await this.registerServiceWorker();

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
        console.log("New push subscription created");
      } else {
        console.log("Using existing push subscription");
      }

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to save subscription to server"
        );
      }

      console.log("Push subscription saved to server");
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   * @param {string} userId - The user ID to unsubscribe
   * @returns {Promise<boolean>}
   */
  async unsubscribe(userId) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Unsubscribe from browser
          const unsubscribed = await subscription.unsubscribe();
          console.log("Unsubscribed from browser push service:", unsubscribed);

          // Remove from server
          const response = await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          });

          if (!response.ok) {
            console.warn("Failed to remove subscription from server");
          } else {
            console.log("Subscription removed from server");
          }

          return unsubscribed;
        }
      }
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  /**
   * Check if user is currently subscribed
   * @returns {Promise<boolean>}
   */
  async isSubscribed() {
    try {
      if (!this.isSupported) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
      }
      return false;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  /**
   * Get current subscription object
   * @returns {Promise<PushSubscription|null>}
   */
  async getSubscription() {
    try {
      if (!this.isSupported) return null;

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        return await registration.pushManager.getSubscription();
      }
      return null;
    } catch (error) {
      console.error("Error getting subscription:", error);
      return null;
    }
  }

  /**
   * Show a local notification (fallback for testing)
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   */
  showLocalNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn("Notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    const defaultOptions = {
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      tag: "arya-farms-notification",
      requireInteraction: false,
      ...options,
    };

    try {
      new Notification(title, defaultOptions);
    } catch (error) {
      console.error("Error showing local notification:", error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   * @param {string} base64String - Base64 encoded VAPID key
   * @returns {Uint8Array}
   */
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Test notifications (for development)
   * @param {string} message - Test message
   */
  async testNotification(
    message = "Test notification from Arya Natural Farms!"
  ) {
    if (Notification.permission === "granted") {
      this.showLocalNotification("Test Notification", {
        body: message,
        icon: "/favicon/android-chrome-192x192.png",
        tag: "test-notification",
      });
    } else {
      console.log("Cannot test notification - permission not granted");
    }
  }

  /**
   * Get browser and device information for debugging
   * @returns {object}
   */
  getBrowserInfo() {
    if (typeof window === "undefined") return null;

    return {
      userAgent: navigator.userAgent,
      isSupported: this.isSupported,
      hasServiceWorker: "serviceWorker" in navigator,
      hasPushManager: "PushManager" in window,
      hasNotification: "Notification" in window,
      permission: this.getPermissionStatus(),
      vapidKeyConfigured: !!this.vapidPublicKey,
    };
  }
}

// Export singleton instance
export default new PushNotificationService();
