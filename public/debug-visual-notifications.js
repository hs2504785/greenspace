/**
 * Visual Notification Debugging Utility
 * This will help identify exactly why notifications aren't appearing visually
 */

window.debugVisualNotifications = async function() {
  console.log("🔍 === VISUAL NOTIFICATION DEBUGGING ===");
  
  // Step 1: Check basic support and permissions
  console.log("\n1️⃣ Basic Checks:");
  console.log("  - Notification permission:", Notification.permission);
  console.log("  - Document visibility:", document.visibilityState);
  console.log("  - Document hidden:", document.hidden);
  console.log("  - Window focused:", document.hasFocus());
  console.log("  - Is secure context:", window.isSecureContext);
  console.log("  - User agent:", navigator.userAgent.substring(0, 100) + "...");
  
  if (Notification.permission !== 'granted') {
    console.error("❌ Permission not granted! This is the main issue.");
    console.log("🔧 Fix: Run Notification.requestPermission()");
    return;
  }
  
  // Step 2: Test different notification methods
  console.log("\n2️⃣ Testing Different Notification Methods:");
  
  // Test 1: Basic Notification constructor
  console.log("Test 1: Basic Notification constructor...");
  try {
    const basicNotification = new Notification("🧪 Test 1: Basic", {
      body: "If you see this, basic notifications work!",
      icon: "/favicon/android-chrome-192x192.png",
      tag: "test-basic"
    });
    
    basicNotification.onclick = () => {
      console.log("✅ Basic notification was clicked!");
      basicNotification.close();
    };
    
    setTimeout(() => basicNotification.close(), 5000);
    console.log("  ✅ Basic notification created");
  } catch (error) {
    console.error("  ❌ Basic notification failed:", error);
  }
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Service Worker notification
  console.log("Test 2: Service Worker notification...");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification("🧪 Test 2: Service Worker", {
        body: "Service worker notification test",
        icon: "/favicon/android-chrome-192x192.png",
        tag: "test-sw",
        requireInteraction: false
      });
      console.log("  ✅ Service Worker notification created");
      
      // Check active notifications
      const activeNotifications = await registration.getNotifications();
      console.log("  📋 Active notifications after creation:", activeNotifications.length);
    } else {
      console.error("  ❌ No service worker registration found");
    }
  } catch (error) {
    console.error("  ❌ Service Worker notification failed:", error);
  }
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Simulate the exact same notification as your app
  console.log("Test 3: Simulating your app's notification...");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const notificationOptions = {
        body: "Arya Natural Farms just added \"Test Product\" to the marketplace",
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
      
      await registration.showNotification("🥬 Test: New Fresh Product Available!", notificationOptions);
      console.log("  ✅ App-style notification created");
      
      // Check all notifications
      const allNotifications = await registration.getNotifications();
      console.log("  📋 All active notifications:", allNotifications.length);
      allNotifications.forEach((n, i) => {
        console.log(`    ${i + 1}. ${n.title} - ${n.body}`);
      });
    }
  } catch (error) {
    console.error("  ❌ App-style notification failed:", error);
  }
  
  // Step 3: Check browser-specific issues
  console.log("\n3️⃣ Browser-Specific Checks:");
  
  // Check if running in iframe
  if (window !== window.top) {
    console.warn("⚠️ Running in iframe - notifications may not work");
  }
  
  // Check protocol
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn("⚠️ Not HTTPS - notifications require HTTPS");
  }
  
  // Check if browser is Chrome
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (isChrome) {
    console.log("✅ Chrome detected - good notification support");
  } else {
    console.log("ℹ️ Non-Chrome browser - check browser-specific notification behavior");
  }
  
  // Step 4: Focus state debugging
  console.log("\n4️⃣ Focus State Analysis:");
  console.log("  Current state:");
  console.log("    - document.visibilityState:", document.visibilityState);
  console.log("    - document.hidden:", document.hidden);
  console.log("    - document.hasFocus():", document.hasFocus());
  
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    console.warn("⚠️ LIKELY ISSUE: Tab is active and focused!");
    console.log("💡 Many browsers (especially Chrome) suppress notifications when:");
    console.log("   - Tab is currently active/focused");
    console.log("   - User is actively using the page");
    console.log("");
    console.log("🔧 SOLUTIONS TO TRY:");
    console.log("   1. Switch to another tab, then add a product");
    console.log("   2. Minimize the browser completely");
    console.log("   3. Run this test again after switching tabs:");
    console.log("      setTimeout(() => window.debugVisualNotifications(), 5000);");
    console.log("      // Then quickly switch to another tab");
  } else {
    console.log("✅ Tab state should allow notifications");
  }
  
  // Step 5: Browser settings check
  console.log("\n5️⃣ Browser Settings to Check:");
  console.log("  1. Chrome notification settings:");
  console.log("     chrome://settings/content/notifications");
  console.log("     - Find 'aryanaturalfarms.vercel.app'");
  console.log("     - Ensure it's set to 'Allow'");
  console.log("");
  console.log("  2. OS notification settings:");
  console.log("     - Windows: Settings > System > Notifications");
  console.log("     - macOS: System Preferences > Notifications > Chrome");
  console.log("     - Ensure 'Do Not Disturb' is OFF");
  console.log("");
  console.log("  3. Browser extensions:");
  console.log("     - Try in incognito/private mode");
  console.log("     - Disable ad blockers temporarily");
  
  // Step 6: Delayed test for focus change
  console.log("\n6️⃣ Setting up delayed test...");
  console.log("🕐 In 10 seconds, a notification will be sent.");
  console.log("💡 QUICKLY switch to another tab or minimize browser NOW!");
  console.log("⏰ Counting down: 10 seconds...");
  
  let countdown = 10;
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      console.log(`⏰ ${countdown} seconds remaining - switch tabs now!`);
    } else {
      clearInterval(countdownInterval);
      
      // Send delayed notification
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.showNotification("🎯 Delayed Test Notification", {
            body: "This notification was sent after a 10-second delay. Did you see it?",
            icon: "/favicon/android-chrome-192x192.png",
            requireInteraction: true,
            tag: "delayed-test"
          });
          console.log("📱 Delayed notification sent! Check if it appeared visually.");
          console.log("📊 Current focus state:", {
            visibility: document.visibilityState,
            hidden: document.hidden,
            focused: document.hasFocus()
          });
        }
      });
    }
  }, 1000);
  
  console.log("\n✅ Visual notification debugging complete!");
  console.log("📋 Watch the console and check if you see any notifications appear.");
};

// Quick focus test
window.testNotificationWithFocusChange = function() {
  console.log("🎯 Focus Change Test - Switch tabs in 5 seconds!");
  
  setTimeout(() => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.showNotification("🔄 Focus Test", {
          body: "Tab focus state: visible=" + document.visibilityState + ", focused=" + document.hasFocus(),
          icon: "/favicon/android-chrome-192x192.png"
        });
        console.log("📱 Focus test notification sent");
        console.log("📊 Focus state when sent:", {
          visibility: document.visibilityState,
          hidden: document.hidden,
          focused: document.hasFocus()
        });
      }
    });
  }, 5000);
};

// Auto-load message
console.log("🔧 Visual notification debugging loaded!");
console.log("🚀 Run: debugVisualNotifications()");
console.log("⚡ Quick test: testNotificationWithFocusChange()");
