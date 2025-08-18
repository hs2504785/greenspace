/**
 * Manual Notification Testing - Immediate Solutions
 * Run these functions to test and fix notification issues
 */

// Test badge updates manually
window.testBadgeUpdate = function() {
  console.log("🔔 Testing badge update...");
  
  // Manually trigger the notification count increment
  // This simulates what should happen when service worker sends a message
  window.dispatchEvent(new CustomEvent('manual-notification-increment'));
  
  // Also test by directly sending a service worker message
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        // Send a test message to trigger badge update
        const mockMessage = {
          type: "NEW_NOTIFICATION",
          notification: {
            title: "Manual Test",
            body: "Manual badge test",
            tag: "manual-test"
          }
        };
        
        // Simulate the message event that should trigger badge update
        window.postMessage({
          data: mockMessage,
          source: registration.active
        }, window.location.origin);
        
        console.log("📨 Sent mock service worker message");
      }
    });
  }
  
  console.log("✅ Badge test triggered - check if count increased");
};

// Force request permission and test immediately
window.forceNotificationTest = async function() {
  console.log("🚀 Force notification test starting...");
  
  // Step 1: Force permission request
  console.log("1. Requesting permission...");
  const permission = await Notification.requestPermission();
  console.log("Permission result:", permission);
  
  if (permission !== 'granted') {
    console.error("❌ Permission denied - cannot proceed");
    console.log("🔧 Fix: Enable notifications in browser settings");
    console.log("Chrome: chrome://settings/content/notifications");
    return;
  }
  
  // Step 2: Test basic notification immediately
  console.log("2. Testing basic notification...");
  const basicTest = new Notification("✅ Permission Works!", {
    body: "Basic notifications are working",
    icon: "/favicon/android-chrome-192x192.png"
  });
  
  setTimeout(() => basicTest.close(), 3000);
  
  // Step 3: Test service worker notification
  console.log("3. Testing service worker notification...");
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification("🔧 Service Worker Test", {
      body: "Service worker notifications working",
      icon: "/favicon/android-chrome-192x192.png",
      requireInteraction: false
    });
  }
  
  // Step 4: Critical focus test
  console.log("4. CRITICAL: Testing focus behavior...");
  console.log("Current focus state:", {
    visibility: document.visibilityState,
    hidden: document.hidden,
    focused: document.hasFocus()
  });
  
  if (document.hasFocus()) {
    console.warn("⚠️ ISSUE FOUND: Tab is focused!");
    console.log("🔧 SOLUTION: Switch to another tab and try again");
    console.log("📱 Setting up 5-second delayed test...");
    console.log("💨 QUICKLY switch to another tab NOW!");
    
    setTimeout(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification("🎯 Focus Test - Did This Appear?", {
          body: "Sent when focus=" + document.hasFocus() + ", hidden=" + document.hidden,
          icon: "/favicon/android-chrome-192x192.png",
          requireInteraction: true
        });
        console.log("📱 Focus test notification sent!");
        console.log("Focus state when sent:", {
          visibility: document.visibilityState,
          hidden: document.hidden,
          focused: document.hasFocus()
        });
      }
    }, 5000);
  }
  
  console.log("✅ Force test complete!");
};

// Test the exact notification your app sends
window.testExactAppNotification = async function() {
  console.log("🎯 Testing exact app notification...");
  
  if (Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }
  
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.error("❌ No service worker registration");
    return;
  }
  
  // Exact same options as your app
  const notificationOptions = {
    body: "Arya Natural Farms just added \"TEST PRODUCT\" to the marketplace",
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
  
  console.log("📱 Sending exact app notification...");
  console.log("📊 Current focus:", {
    visibility: document.visibilityState,
    focused: document.hasFocus()
  });
  
  await registration.showNotification("🥬 TEST: New Fresh Product Available!", notificationOptions);
  
  // Check if it was created
  const notifications = await registration.getNotifications();
  console.log("📋 Active notifications after creation:", notifications.length);
  
  console.log("✅ Exact app notification sent!");
  
  if (document.hasFocus()) {
    console.warn("⚠️ Tab is focused - notification might not appear visually");
    console.log("💡 Try switching tabs and running this again");
  }
};

// Ultimate fix attempt
window.ultimateNotificationFix = async function() {
  console.log("🚀 === ULTIMATE NOTIFICATION FIX ===");
  
  // Step 1: Permission
  console.log("Step 1: Ensuring permission...");
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert("Please enable notifications in browser settings:\nChrome: chrome://settings/content/notifications");
      return;
    }
  }
  console.log("✅ Permission granted");
  
  // Step 2: Focus warning
  if (document.hasFocus()) {
    alert("IMPORTANT: You need to switch to another tab for notifications to appear!\n\nAfter clicking OK:\n1. Open a new tab\n2. Come back and add a product from seller page\n3. Check the new tab for notifications");
  }
  
  // Step 3: Test notifications with different focus states
  console.log("Step 2: Testing with different approaches...");
  
  // Immediate test
  new Notification("🧪 Immediate Test", {
    body: "This should appear if tab is not focused",
    icon: "/favicon/android-chrome-192x192.png"
  });
  
  // Service worker test
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification("🔧 SW Test", {
      body: "Service worker notification test",
      icon: "/favicon/android-chrome-192x192.png"
    });
  }
  
  // Step 4: Instructions
  console.log("Step 3: Final instructions...");
  console.log("📋 TO GET NOTIFICATIONS WORKING:");
  console.log("1. ✅ Permission is now granted");
  console.log("2. 🔄 Open buyer page in one tab");
  console.log("3. 🔄 Open seller page in another tab");
  console.log("4. 📦 Add product from seller tab");
  console.log("5. 👀 Check buyer tab - notification should appear");
  console.log("6. 📱 Badge count should update immediately");
  
  console.log("✅ Ultimate fix complete!");
};

// Auto-load
console.log("🔧 Manual notification testing loaded!");
console.log("Available functions:");
console.log("  - testBadgeUpdate() - Test badge count");
console.log("  - forceNotificationTest() - Force permission & test");
console.log("  - testExactAppNotification() - Test your app's exact notification");
console.log("  - ultimateNotificationFix() - Complete fix attempt");
console.log("");
console.log("🚀 Quick start: ultimateNotificationFix()");
