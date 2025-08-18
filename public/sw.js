// Custom Service Worker for Push Notifications
// This will be enhanced by next-pwa

const CACHE_NAME = "arya-farms-v1";
const urlsToCache = [
  "/",
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  const defaultOptions = {
    body: "New product available!",
    icon: "/favicon/android-chrome-192x192.png",
    badge: "/favicon/android-chrome-192x192.png",
    tag: "arya-farms-notification",
    requireInteraction: true,
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
    self.registration
      .showNotification(
        notificationOptions.title || "Arya Natural Farms",
        notificationOptions
      )
      .then(() => {
        console.log("✅ SW: Notification shown successfully!");
      })
      .catch((error) => {
        console.error("❌ SW: Failed to show notification:", error);
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
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
