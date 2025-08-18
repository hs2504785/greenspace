/**
 * Quick notification test for debugging
 * Run in browser console: loadNotificationTest()
 */

window.loadNotificationTest = function() {
  console.log("🧪 Loading notification test...");
  
  // Test service worker messaging
  window.testServiceWorkerMessaging = function() {
    console.log("📨 Testing service worker messaging...");
    
    if (!navigator.serviceWorker) {
      console.error("❌ Service worker not supported");
      return;
    }
    
    navigator.serviceWorker.ready.then(registration => {
      console.log("✅ Service worker ready");
      
      // Listen for messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log("📨 Received message from service worker:", event.data);
      });
      
      // Send a test message to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'TEST_MESSAGE',
          data: 'Hello from client'
        });
        console.log("📤 Test message sent to service worker");
      }
    });
  };
  
  // Test notification display
  window.testNotificationDisplay = function() {
    console.log("🔔 Testing notification display...");
    
    if (Notification.permission !== 'granted') {
      console.error("❌ Permission not granted:", Notification.permission);
      return;
    }
    
    // Test 1: Basic notification
    console.log("1. Testing basic notification...");
    new Notification("Test 1: Basic", {
      body: "Basic notification test",
      icon: "/favicon/android-chrome-192x192.png"
    });
    
    setTimeout(() => {
      // Test 2: Service worker notification
      console.log("2. Testing service worker notification...");
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification("Test 2: Service Worker", {
          body: "Service worker notification test",
          icon: "/favicon/android-chrome-192x192.png",
          tag: "test-sw"
        });
      });
    }, 2000);
    
    setTimeout(() => {
      // Test 3: Simulate push notification
      console.log("3. Testing push notification simulation...");
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification("Test 3: Push Simulation", {
          body: "Simulating push notification",
          icon: "/favicon/android-chrome-192x192.png",
          badge: "/favicon/android-chrome-192x192.png",
          tag: "arya-farms-notification",
          requireInteraction: false,
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
          ]
        });
      });
    }, 4000);
    
    console.log("📋 Watch for notifications over the next 6 seconds...");
    console.log("💡 If no visual notifications appear:");
    console.log("  1. Switch to another tab");
    console.log("  2. Minimize the browser");
    console.log("  3. Check browser notification settings");
    console.log("  4. Check OS notification settings");
  };
  
  // Test focus state
  window.testFocusState = function() {
    console.log("🎯 Testing focus state...");
    console.log("  - Document visibility:", document.visibilityState);
    console.log("  - Window focused:", document.hasFocus());
    console.log("  - Tab active:", !document.hidden);
    
    if (document.hasFocus()) {
      console.log("⚠️ Tab is currently focused - many browsers suppress notifications when tab is active");
      console.log("💡 Try switching to another tab and then add a product");
    } else {
      console.log("✅ Tab is not focused - notifications should appear");
    }
  };
  
  // Complete test suite
  window.runCompleteTest = function() {
    console.log("🚀 Running complete notification test...");
    
    testFocusState();
    
    setTimeout(() => testServiceWorkerMessaging(), 1000);
    setTimeout(() => testNotificationDisplay(), 2000);
    
    console.log("📊 Test will complete in ~10 seconds...");
  };
  
  console.log("✅ Notification test loaded! Available functions:");
  console.log("  - testServiceWorkerMessaging()");
  console.log("  - testNotificationDisplay()");
  console.log("  - testFocusState()");
  console.log("  - runCompleteTest()");
  console.log("");
  console.log("🎯 Quick start: runCompleteTest()");
};

// Auto-load
window.loadNotificationTest();
