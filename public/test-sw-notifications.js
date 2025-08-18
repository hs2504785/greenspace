/**
 * Test Service Worker Notifications vs Direct Notifications
 * This will identify why test button works but add product doesn't
 */

window.testServiceWorkerNotifications = async function() {
  console.log("🔍 === SERVICE WORKER NOTIFICATION TEST ===");
  console.log("Testing the EXACT path that add product uses...\n");
  
  if (Notification.permission !== 'granted') {
    console.error("❌ Permission not granted");
    return;
  }
  
  // Test 1: Direct notification (like test button)
  console.log("1️⃣ Testing DIRECT notification (like test button):");
  try {
    const directNotification = new Notification("🧪 Direct Test", {
      body: "This is a direct notification like the test button",
      icon: "/favicon/android-chrome-192x192.png",
      tag: "direct-test"
    });
    
    setTimeout(() => directNotification.close(), 3000);
    console.log("✅ Direct notification sent");
  } catch (error) {
    console.error("❌ Direct notification failed:", error);
  }
  
  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Service Worker notification (like add product)
  console.log("\n2️⃣ Testing SERVICE WORKER notification (like add product):");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error("❌ No service worker registration found");
      return;
    }
    
    console.log("📡 Service worker found, showing notification...");
    
    // Use the EXACT same method as the service worker push handler
    await registration.showNotification("🧪 Service Worker Test", {
      body: "This is a service worker notification like add product uses",
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      tag: "sw-test",
      requireInteraction: false,
      vibrate: [100, 50, 100],
      actions: [
        {
          action: "view",
          title: "View Products",
          icon: "/favicon/android-chrome-192x192.png"
        },
        {
          action: "close", 
          title: "Close"
        }
      ],
      data: {
        url: "/",
        timestamp: Date.now(),
        type: "sw_test"
      }
    });
    
    console.log("✅ Service worker notification sent");
    
  } catch (error) {
    console.error("❌ Service worker notification failed:", error);
  }
  
  // Test 3: Simulate the exact push event flow
  console.log("\n3️⃣ Testing PUSH EVENT simulation:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      
      // Send a message to service worker to trigger push handler
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        console.log("📨 Service worker response:", event.data);
      };
      
      // Send test push data
      registration.active.postMessage({
        type: "SIMULATE_PUSH",
        pushData: {
          title: "🧪 Push Simulation Test",
          message: "This simulates the exact add product push flow",
          icon: "/favicon/android-chrome-192x192.png",
          badge: "/favicon/android-chrome-192x192.png",
          url: "/vegetables/test",
          data: {
            productId: "test-123",
            productName: "Test Product",
            sellerId: "test-seller",
            sellerName: "Test Seller",
            type: "new_product"
          }
        }
      }, [messageChannel.port2]);
      
      console.log("📡 Push simulation sent to service worker");
      
    }
  } catch (error) {
    console.error("❌ Push simulation failed:", error);
  }
  
  console.log("\n🔍 RESULTS ANALYSIS:");
  console.log("- If DIRECT works but SERVICE WORKER doesn't:");
  console.log("  → Chrome blocks service worker notifications differently");
  console.log("  → Need to check chrome://settings/content/notifications");
  console.log("  → Look for service worker specific restrictions");
  console.log("- If both work:");
  console.log("  → Issue is in the push message delivery from server");
  console.log("  → Check API logs and push subscription");
  console.log("- If neither work:");
  console.log("  → Browser/OS settings issue");
};

// Quick test function
window.testSWNotificationNow = async function() {
  console.log("🧪 Quick service worker notification test...");
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification("🔧 SW Quick Test", {
        body: "Service worker notification test - did you see this?",
        icon: "/favicon/android-chrome-192x192.png",
        requireInteraction: false
      });
      console.log("📱 Service worker notification sent!");
    } else {
      console.log("❌ No service worker registration");
    }
  } catch (error) {
    console.error("❌ Failed:", error);
  }
};

// Auto-load message
console.log("🧪 Service Worker Notification Test loaded!");
console.log("🚀 Run: testServiceWorkerNotifications()");
console.log("⚡ Quick test: testSWNotificationNow()");
console.log("This will test the EXACT difference between test button vs add product");
