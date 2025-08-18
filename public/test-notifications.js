/**
 * Comprehensive Notification Testing Utility
 * Run this in browser console to test various notification scenarios
 * Usage: window.testNotifications()
 */

window.testNotifications = async function() {
  console.log("🧪 === COMPREHENSIVE NOTIFICATION TEST ===");
  
  // Test 1: Basic browser support and permission
  console.log("\n1️⃣ Testing Basic Support:");
  console.log("  - Notification support:", 'Notification' in window);
  console.log("  - Service Worker support:", 'serviceWorker' in navigator);
  console.log("  - Current permission:", Notification.permission);
  
  if (!('Notification' in window)) {
    console.error("❌ Notifications not supported");
    return;
  }
  
  // Test 2: Permission flow
  console.log("\n2️⃣ Testing Permission:");
  if (Notification.permission === 'default') {
    console.log("  - Requesting permission...");
    const permission = await Notification.requestPermission();
    console.log("  - Permission result:", permission);
  } else {
    console.log("  - Permission already set:", Notification.permission);
  }
  
  if (Notification.permission !== 'granted') {
    console.error("❌ Permission not granted. Enable notifications in browser settings:");
    console.log("   Chrome: chrome://settings/content/notifications");
    console.log("   Edge: edge://settings/content/notifications");
    console.log("   Firefox: about:preferences#privacy");
    return;
  }
  
  // Test 3: Basic Notification API
  console.log("\n3️⃣ Testing Basic Notification API:");
  try {
    const basicNotification = new Notification("Test 1: Basic API", {
      body: "If you see this, basic notifications work!",
      icon: "/favicon/android-chrome-192x192.png",
      tag: "test-basic"
    });
    
    setTimeout(() => basicNotification.close(), 5000);
    console.log("  ✅ Basic notification sent");
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error("  ❌ Basic notification failed:", error);
  }
  
  // Test 4: Service Worker Notifications
  console.log("\n4️⃣ Testing Service Worker Notifications:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error("  ❌ No service worker registered");
      return;
    }
    
    console.log("  - Service worker found:", registration.scope);
    
    await registration.showNotification("Test 2: Service Worker", {
      body: "Service worker notification test",
      icon: "/favicon/android-chrome-192x192.png",
      tag: "test-sw",
      requireInteraction: false
    });
    
    console.log("  ✅ Service worker notification sent");
    
    // Check active notifications
    const activeNotifications = await registration.getNotifications();
    console.log("  - Active notifications:", activeNotifications.length);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error("  ❌ Service worker notification failed:", error);
  }
  
  // Test 5: Different notification options
  console.log("\n5️⃣ Testing Different Notification Options:");
  
  const testCases = [
    {
      name: "Simple notification",
      options: {
        body: "Simple test notification",
        icon: "/favicon/android-chrome-192x192.png"
      }
    },
    {
      name: "Notification with actions",
      options: {
        body: "Notification with action buttons",
        icon: "/favicon/android-chrome-192x192.png",
        actions: [
          { action: 'view', title: 'View' },
          { action: 'close', title: 'Close' }
        ],
        requireInteraction: false
      }
    },
    {
      name: "High priority notification",
      options: {
        body: "High priority notification",
        icon: "/favicon/android-chrome-192x192.png",
        requireInteraction: true,
        vibrate: [100, 50, 100]
      }
    }
  ];
  
  const registration = await navigator.serviceWorker.getRegistration();
  
  for (const testCase of testCases) {
    try {
      console.log(`  - Testing: ${testCase.name}`);
      await registration.showNotification(`Test: ${testCase.name}`, testCase.options);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`  ❌ ${testCase.name} failed:`, error);
    }
  }
  
  // Test 6: Focus state test
  console.log("\n6️⃣ Testing Focus State Behavior:");
  console.log("  - Current document visibility:", document.visibilityState);
  console.log("  - Current window focus:", document.hasFocus());
  
  if (document.hasFocus()) {
    console.log("  ⚠️ Tab is focused - some browsers don't show notifications when tab is active");
    console.log("  💡 Try switching to another tab and running the test again");
  }
  
  // Test 7: Browser and OS information
  console.log("\n7️⃣ Environment Information:");
  console.log("  - User Agent:", navigator.userAgent);
  console.log("  - Platform:", navigator.platform);
  console.log("  - Language:", navigator.language);
  console.log("  - Online:", navigator.onLine);
  console.log("  - Secure Context:", window.isSecureContext);
  
  // Test 8: Advanced debugging
  console.log("\n8️⃣ Advanced Debugging:");
  
  // Check notification settings
  if ('permissions' in navigator) {
    try {
      const notificationPermission = await navigator.permissions.query({name: 'notifications'});
      console.log("  - Permissions API notification state:", notificationPermission.state);
    } catch (error) {
      console.log("  - Permissions API not available or failed");
    }
  }
  
  // Check if running in iframe
  if (window !== window.top) {
    console.log("  ⚠️ Running in iframe - notifications might not work");
  }
  
  // Check protocol
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.log("  ⚠️ Not HTTPS - notifications require HTTPS (except localhost)");
  }
  
  console.log("\n🎯 Manual Tests to Try:");
  console.log("  1. Switch to another tab/window and add a product");
  console.log("  2. Minimize the browser and add a product");
  console.log("  3. Check browser notification settings:");
  console.log("     - Chrome: chrome://settings/content/notifications");
  console.log("     - Look for your site and ensure it's 'Allowed'");
  console.log("  4. Check OS notification settings:");
  console.log("     - Windows: Settings > System > Notifications & actions");
  console.log("     - macOS: System Preferences > Notifications");
  console.log("  5. Try in incognito/private mode");
  console.log("  6. Try different browsers");
  
  console.log("\n✅ Test complete! Check if you saw any visual notifications.");
  console.log("💡 If no notifications appeared visually, check the suggestions above.");
};

// Quick permission request function
window.requestNotificationPermission = async function() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    return permission;
  }
  console.error('Notifications not supported');
  return 'denied';
};

// Quick test function
window.quickNotificationTest = function() {
  if (Notification.permission === 'granted') {
    new Notification('Quick Test', {
      body: 'This is a quick test notification',
      icon: '/favicon/android-chrome-192x192.png'
    });
  } else {
    console.log('Permission not granted. Run window.requestNotificationPermission() first.');
  }
};

console.log("🔧 Notification testing utilities loaded:");
console.log("  - window.testNotifications() - Full test suite");
console.log("  - window.requestNotificationPermission() - Request permission");
console.log("  - window.quickNotificationTest() - Quick test");
