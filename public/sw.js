// Clean Service Worker - Caching Only (No Notifications)

const CACHE_NAME = "arya-farms-v3";
const STATIC_CACHE_NAME = "arya-farms-static-v3";
const DYNAMIC_CACHE_NAME = "arya-farms-dynamic-v3";

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
      // Take control of all clients immediately
      self.clients.claim(),

      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

// Fetch event with improved caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from our domain
  if (url.origin !== location.origin) {
    return;
  }

  // Different strategies for different types of requests
  if (request.url.includes("/api/")) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else if (
    request.destination === "image" ||
    request.url.includes("/favicon/") ||
    request.url.includes("/images/")
  ) {
    // Images and static assets - cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else {
    // HTML pages and other resources - stale while revalidate
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
  }
});

// Caching strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn("Cache first strategy failed:", error);
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Return cached response if network fails
      return cachedResponse;
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    // Only cache successful GET requests (POST requests can't be cached)
    if (networkResponse.status === 200 && request.method === "GET") {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Basic message handling (for service worker updates)
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

  // Handle other message types and always send a response
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      success: true,
      message: "Message received",
      type: event.data?.type || "unknown",
    });
  }
});
