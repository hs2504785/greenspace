"use client";

import { useEffect } from "react";

/**
 * Global Service Worker Registration Component
 * Ensures the service worker is registered on every page load
 * This is essential for receiving push notifications even if users
 * haven't explicitly enabled notifications
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Add global error handler for message channel errors
    const handleError = (event) => {
      const errorMessage = event.error?.message || event.message || "";
      if (errorMessage.includes("message channel closed")) {
        console.warn(
          "⚠️ Service Worker message channel error caught (likely from browser extension):",
          errorMessage
        );
        // Prevent the error from showing in console
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason?.message || event.reason || "";
      if (
        typeof reason === "string" &&
        reason.includes("message channel closed")
      ) {
        console.warn(
          "⚠️ Service Worker promise rejection caught (likely from browser extension):",
          reason
        );
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.log("🚫 Service Workers not supported");
      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection
        );
      };
    }

    const registerServiceWorker = async () => {
      try {
        // Check if already registered
        let registration = await navigator.serviceWorker.getRegistration("/");

        if (!registration) {
          // Register new service worker
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
          console.log(
            "🔧 Service Worker registered globally:",
            registration.scope
          );
        } else {
          console.log(
            "✅ Service Worker already registered:",
            registration.scope
          );
        }

        // Handle service worker updates immediately
        if (registration.waiting) {
          console.log("🔄 Service Worker update pending, activating immediately...");
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Wait for the new service worker to take control
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log("🔄 Service Worker updated and activated");
            window.location.reload();
          });
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("🚀 Service Worker is ready");

        // Add event listener for service worker updates (with error handling)
        if (
          registration &&
          typeof registration.addEventListener === "function"
        ) {
          registration.addEventListener("updatefound", () => {
            console.log("🔄 Service Worker update found");
            const newWorker = registration.installing;
            if (newWorker && typeof newWorker.addEventListener === "function") {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("🔄 New service worker installed, activating...");
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        }

        return registration;
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
        // Don't throw - let the app continue without service worker
        return null;
      }
    };

    // Register service worker immediately
    registerServiceWorker().catch((error) => {
      console.error("❌ Failed to register service worker:", error);
    });

    // Cleanup function
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // This component doesn't render anything
  return null;
}
