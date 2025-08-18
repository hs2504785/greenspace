// Custom Service Worker for Push Notifications
// This will be enhanced by next-pwa

const CACHE_NAME = "arya-farms-v2";
const STATIC_CACHE_NAME = "arya-farms-static-v2";
const DYNAMIC_CACHE_NAME = "arya-farms-dynamic-v2";

// Global error handlers to prevent uncaught promise rejections
self.addEventListener("error", (event) => {
  console.error("❌ Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Service Worker unhandled promise rejection:", event.reason);
  event.preventDefault(); // Prevent the default behavior
});

const urlsToCache = [
  "/",
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  // Skip waiting immediately to activate new service worker
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("❌ Cache setup failed during install:", error);
      })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event with improved caching strategies
self.addEventListener("fetch", (event) => {
  try {
    const url = new URL(event.request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
      return;
    }

    // Handle different types of requests with appropriate caching strategies
    if (event.request.method === "GET") {
      event.respondWith(
        handleFetch(event.request).catch((error) => {
          console.error("❌ Fetch handler error:", error);
          // Return a basic fetch as fallback
          return fetch(event.request);
        })
      );
    }
  } catch (error) {
    console.error("❌ Fetch event error:", error);
  }
});

async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Static assets (images, fonts, icons) - Cache First
    if (
      request.url.match(
        /\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i
      )
    ) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }

    // CSS and JS files - Stale While Revalidate
    if (request.url.match(/\.(css|js)$/i)) {
      return await staleWhileRevalidate(request, STATIC_CACHE_NAME);
    }

    // API requests - Network First
    if (url.pathname.startsWith("/api/")) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME);
    }

    // Pages - Network First with cache fallback
    return await networkFirst(request, DYNAMIC_CACHE_NAME);
  } catch (error) {
    console.error("Fetch handler error:", error);
    // Fallback to cache or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/");
    }

    throw error;
  }
}

// Cache First Strategy - good for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Stale While Revalidate Strategy - good for CSS/JS
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || (await networkResponsePromise);
}

// Network First Strategy - good for dynamic content
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  const defaultOptions = {
    body: "New product available!",
    icon: "/favicon/android-chrome-192x192.png",
    badge: "/favicon/android-chrome-192x192.png",
    tag: "arya-farms-notification",
    requireInteraction: false, // Changed to false to force display regardless of focus
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "view",
        title: "View Products",
        icon: "/favicon/android-chrome-192x192.png",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
    data: {
      url: "/",
      timestamp: Date.now(),
    },
  };

  let notificationOptions = defaultOptions;

  if (event.data) {
    try {
      const data = event.data.json();
      console.log("🔍 SW: Parsed push data:", data);
      notificationOptions = {
        ...defaultOptions,
        body: data.message || defaultOptions.body,
        title: data.title || "Arya Natural Farms",
        data: {
          ...defaultOptions.data,
          ...data.data,
          url: data.url || defaultOptions.data.url,
        },
      };
      console.log("🔍 SW: Final notification options:", notificationOptions);
    } catch (error) {
      console.error("❌ SW: Error parsing push notification data:", error);
    }
  } else {
    console.log("ℹ️ SW: No data in push event, using defaults");
  }

  console.log(
    "📱 SW: About to show notification with title:",
    notificationOptions.title || "Arya Natural Farms"
  );

  event.waitUntil(
    Promise.resolve().then(async () => {
      // Check notification permission before attempting to show
      const permission = await self.registration.pushManager.permissionState({
        userVisibleOnly: true,
      });
      console.log("🔐 SW: Notification permission state:", permission);

      // Check if registration is active
      console.log("📱 SW: Service worker registration state:", {
        scope: self.registration.scope,
        active: !!self.registration.active,
        installing: !!self.registration.installing,
        waiting: !!self.registration.waiting,
      });

      // Attempt to show notification with detailed error handling
      try {
        await self.registration.showNotification(
          notificationOptions.title || "Arya Natural Farms",
          notificationOptions
        );
        console.log("✅ SW: Notification shown successfully!");

        // Double-check: Get all notifications to verify it was actually created
        const notifications = await self.registration.getNotifications();
        console.log("📋 SW: Active notifications count:", notifications.length);
        console.log(
          "📋 SW: Active notifications:",
          notifications.map((n) => ({
            title: n.title,
            body: n.body,
            tag: n.tag,
          }))
        );

        // Additional debugging for visual notification display
        console.log("🔍 SW: Notification debugging info:");
        console.log(
          "  - Notification options used:",
          JSON.stringify(notificationOptions, null, 2)
        );
        console.log("  - Registration scope:", self.registration.scope);
        console.log(
          "  - Service worker state:",
          self.registration.active?.state
        );

        // Check if notifications were actually created with the tag
        const taggedNotifications = await self.registration.getNotifications({
          tag: notificationOptions.tag,
        });
        console.log(
          "🏷️ SW: Notifications with same tag:",
          taggedNotifications.length
        );

        // Log potential reasons why notification might not appear visually
        console.log(
          "💡 SW: If notification doesn't appear visually, possible causes:"
        );
        console.log(
          "  1. Browser tab is active (many browsers only show when tab is inactive)"
        );
        console.log("  2. Browser notification settings block the site");
        console.log("  3. OS notification settings are disabled");
        console.log("  4. 'Do Not Disturb' mode is enabled");
        console.log("  5. Browser extensions are interfering");
        console.log("  💡 Try: Switch to another tab or minimize browser");

        // Notify clients about new notification for badge update
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });
        console.log(
          "📡 SW: Notifying clients about new notification, client count:",
          clients.length
        );

        if (clients.length === 0) {
          console.warn("⚠️ SW: No clients found - trying alternative methods");

          // Try to get all clients including uncontrolled ones
          const allClients = await self.clients.matchAll({
            includeUncontrolled: true,
          });
          console.log(
            "📡 SW: All clients (including uncontrolled):",
            allClients.length
          );

          // Also try broadcasting to all possible clients
          try {
            // Use BroadcastChannel as fallback
            const channel = new BroadcastChannel("notification-updates");
            channel.postMessage({
              type: "NEW_NOTIFICATION",
              notification: {
                title: notificationOptions.title || "Arya Natural Farms",
                body: notificationOptions.body,
                tag: notificationOptions.tag,
              },
            });
            console.log("📻 SW: Sent via BroadcastChannel");
            channel.close();
          } catch (broadcastError) {
            console.warn("⚠️ SW: BroadcastChannel not available");
          }
        }

        clients.forEach((client) => {
          console.log(
            "📨 SW: Sending message to client:",
            client.id,
            "URL:",
            client.url
          );
          try {
            client.postMessage({
              type: "NEW_NOTIFICATION",
              notification: {
                title: notificationOptions.title || "Arya Natural Farms",
                body: notificationOptions.body,
                tag: notificationOptions.tag,
              },
            });
          } catch (error) {
            console.error("❌ SW: Failed to send message to client:", error);
          }
        });
      } catch (error) {
        console.error("❌ SW: Failed to show notification:", error);
        console.error("❌ SW: Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        // Try alternative notification approach
        try {
          console.log("🔄 SW: Attempting fallback notification...");
          await self.registration.showNotification("Test Notification", {
            body: "Fallback notification test",
            icon: "/favicon/android-chrome-192x192.png",
            tag: "fallback-test",
          });
          console.log("✅ SW: Fallback notification shown!");
        } catch (fallbackError) {
          console.error(
            "❌ SW: Fallback notification also failed:",
            fallbackError
          );
        }
      }
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  if (event.action === "view") {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          // If not, open a new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === "close") {
    // Just close notification - no action needed
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync for offline notifications
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync for offline notifications
      console.log("Handling background sync for notifications")
    );
  }
});

// Message event for communication with main thread
self.addEventListener("message", (event) => {
  console.log("📨 Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    // Send response back to indicate completion
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
    return;
  }

  if (event.data && event.data.type === "TEST_MESSAGE") {
    console.log("🧪 Service Worker: Handling test message");
    // Send response back to client
    event.source.postMessage({
      type: "TEST_RESPONSE",
      message: "Service Worker received test message successfully!",
      timestamp: Date.now(),
    });
    return;
  }

  // Handle other message types and always send a response
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      success: true,
      message: "Message received",
      type: event.data?.type || "unknown",
    });
  }
});
