/**
 * Fix Visual Notifications - Targeted Solution
 * Focuses specifically on making notifications appear on screen
 */

window.fixVisualNotifications = async function() {
  console.log("👁️ === FIX VISUAL NOTIFICATIONS ===");
  
  // Step 1: Check and request permission properly
  console.log("Step 1: Checking notification permission...");
  
  if (Notification.permission === 'default') {
    console.log("🔐 Requesting permission...");
    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);
    
    if (permission !== 'granted') {
      console.error("❌ Permission denied!");
      alert("Please enable notifications:\n\n1. Click the 🔒 lock icon in address bar\n2. Set Notifications to 'Allow'\n3. Refresh page and try again");
      return;
    }
  } else if (Notification.permission === 'denied') {
    console.error("❌ Permission permanently denied!");
    alert("Notifications are blocked! To fix:\n\n1. Go to chrome://settings/content/notifications\n2. Find this site\n3. Change from 'Block' to 'Allow'\n4. Refresh page");
    return;
  } else {
    console.log("✅ Permission already granted");
  }
  
  // Step 2: Test different notification approaches
  console.log("\nStep 2: Testing different notification approaches...");
  
  const focusState = {
    visibility: document.visibilityState,
    hidden: document.hidden,
    focused: document.hasFocus()
  };
  
  console.log("📊 Current focus state:", focusState);
  
  // Test 1: Force basic notification
  console.log("🧪 Test 1: Force basic notification (ignoring focus)");
  try {
    const basicNotification = new Notification("🧪 FORCE TEST", {
      body: "This notification should appear immediately!",
      icon: "/favicon/android-chrome-192x192.png",
      requireInteraction: false,
      silent: false
    });
    
    basicNotification.onclick = () => {
      console.log("✅ Basic notification was clicked!");
      basicNotification.close();
    };
    
    // Keep it visible longer
    setTimeout(() => {
      basicNotification.close();
      console.log("🔄 Basic notification closed after 8 seconds");
    }, 8000);
    
    console.log("✅ Basic notification created - did you see it?");
  } catch (error) {
    console.error("❌ Basic notification failed:", error);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Service worker notification with specific options
  console.log("🧪 Test 2: Service worker notification (optimized for visibility)");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification("🔧 SW FORCE TEST", {
        body: "Service worker notification - optimized for visibility",
        icon: "/favicon/android-chrome-192x192.png",
        badge: "/favicon/android-chrome-192x192.png",
        requireInteraction: false,
        silent: false,
        renotify: true,
        tag: "force-visual-test-" + Date.now(), // Unique tag to avoid replacement
        vibrate: [200, 100, 200, 100, 200],
        timestamp: Date.now()
      });
      
      console.log("✅ Service worker notification created - did you see it?");
      
      // Check if it was actually created
      const notifications = await registration.getNotifications();
      console.log("📋 Total active notifications:", notifications.length);
      
    } else {
      console.error("❌ No service worker registration");
    }
  } catch (error) {
    console.error("❌ Service worker notification failed:", error);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 3: Multiple rapid notifications
  console.log("🧪 Test 3: Multiple rapid notifications with different tags");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const notificationPromises = [];
      
      for (let i = 1; i <= 3; i++) {
        const promise = registration.showNotification(`🎯 Multi Test ${i}`, {
          body: `Rapid notification test ${i} - look for this!`,
          icon: "/favicon/android-chrome-192x192.png",
          requireInteraction: false,
          tag: `multi-test-${i}-${Date.now()}`,
          vibrate: [100],
          timestamp: Date.now() + i
        });
        notificationPromises.push(promise);
        
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await Promise.all(notificationPromises);
      console.log("✅ Multiple notifications created - did you see any?");
    }
  } catch (error) {
    console.error("❌ Multiple notifications failed:", error);
  }
  
  // Step 3: Browser-specific diagnostic
  console.log("\nStep 3: Browser-specific diagnostic...");
  
  // Check user agent
  const userAgent = navigator.userAgent;
  console.log("🌐 Browser:", userAgent.substring(0, 100));
  
  // Check for known issues
  const issues = [];
  
  if (userAgent.includes('Chrome')) {
    console.log("✅ Chrome detected - should have good notification support");
    
    if (focusState.focused && focusState.visibility === 'visible') {
      issues.push("🔴 LIKELY ISSUE: Chrome suppresses notifications when tab is active");
      console.log("💡 SOLUTION: Switch to another tab and run test again");
    }
    
    // Chrome-specific checks
    console.log("🔍 Chrome-specific checks:");
    console.log("  - Go to chrome://settings/content/notifications");
    console.log("  - Find: " + location.hostname);
    console.log("  - Should be: Allow");
    
  } else if (userAgent.includes('Firefox')) {
    console.log("✅ Firefox detected");
    if (focusState.focused) {
      issues.push("🔴 Firefox may suppress notifications when tab is active");
    }
  } else if (userAgent.includes('Safari')) {
    issues.push("⚠️ Safari has limited notification support");
    console.log("💡 Try Chrome or Firefox for better results");
  }
  
  // Check OS
  const platform = navigator.platform;
  console.log("🖥️ Platform:", platform);
  
  if (platform.includes('Mac')) {
    console.log("🍎 macOS detected - check System Preferences > Notifications");
    console.log("  - Find: Chrome (or your browser)");
    console.log("  - Enable: Allow Notifications");
    console.log("  - Disable: Do Not Disturb");
  } else if (platform.includes('Win')) {
    console.log("🪟 Windows detected - check Settings > System > Notifications");
    console.log("  - Enable: Get notifications from apps and senders");
    console.log("  - Find: Chrome (or your browser)");
    console.log("  - Enable: Show notifications");
  }
  
  // Step 4: Manual checks
  console.log("\nStep 4: Manual checks you should do...");
  
  console.log("🔍 BROWSER SETTINGS:");
  console.log("1. Right-click on address bar → Site settings");
  console.log("2. Check 'Notifications' is set to 'Allow'");
  console.log("3. Or go to chrome://settings/content/notifications");
  console.log("4. Find this site and ensure it's allowed");
  
  console.log("\n🔍 OS SETTINGS:");
  console.log("1. Check if 'Do Not Disturb' is enabled");
  console.log("2. Check browser is allowed to show notifications");
  console.log("3. Check notification center/action center");
  
  console.log("\n🔍 EXTENSIONS:");
  console.log("1. Try incognito/private mode");
  console.log("2. Disable ad blockers temporarily");
  console.log("3. Check if any extensions block notifications");
  
  // Step 5: Focus change test
  console.log("\nStep 5: Setting up focus change test...");
  
  if (focusState.focused) {
    console.log("🎯 CRITICAL: Tab is currently focused!");
    console.log("📱 Setting up test for when you change tabs...");
    console.log("💨 Switch to another tab within 10 seconds!");
    
    let testTriggered = false;
    
    const triggerBackgroundTest = () => {
      if (!testTriggered && document.hidden) {
        testTriggered = true;
        console.log("🎯 Tab is now hidden - testing notification!");
        
        // Test basic notification in background
        new Notification("🎯 BACKGROUND TEST", {
          body: "This was sent when tab was in background. Did you see it?",
          icon: "/favicon/android-chrome-192x192.png",
          requireInteraction: true,
          vibrate: [200, 100, 200]
        });
        
        // Test service worker notification too
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.showNotification("🎯 SW BACKGROUND TEST", {
              body: "Service worker notification sent in background",
              icon: "/favicon/android-chrome-192x192.png",
              requireInteraction: true,
              tag: "background-test-" + Date.now(),
              vibrate: [100, 50, 100]
            });
          }
        });
        
        console.log("📱 Background notifications sent!");
        document.removeEventListener('visibilitychange', triggerBackgroundTest);
      }
    };
    
    document.addEventListener('visibilitychange', triggerBackgroundTest);
    
    // Auto-trigger after 10 seconds if no tab change
    setTimeout(() => {
      if (!testTriggered) {
        console.log("⏰ 10 seconds elapsed - you didn't switch tabs");
        console.log("💡 Try switching to another tab to test notifications");
        document.removeEventListener('visibilitychange', triggerBackgroundTest);
      }
    }, 10000);
  }
  
  console.log("\n✅ VISUAL NOTIFICATION FIX COMPLETE!");
  console.log("📋 RESULTS:");
  console.log(`  - Permission: ${Notification.permission}`);
  console.log(`  - Focus State: ${focusState.focused ? 'ACTIVE (problematic)' : 'Background (good)'}`);
  console.log(`  - Browser: ${userAgent.includes('Chrome') ? 'Chrome (good)' : 'Other'}`);
  console.log(`  - Tests Run: Basic, Service Worker, Multiple`);
  
  if (issues.length > 0) {
    console.log("\n⚠️ ISSUES DETECTED:");
    issues.forEach(issue => console.log(issue));
  }
  
  console.log("\n🎯 MOST LIKELY SOLUTIONS:");
  console.log("1. 🔄 Switch to another tab and add a product");
  console.log("2. 🔄 Minimize browser and add a product");
  console.log("3. 🔧 Check chrome://settings/content/notifications");
  console.log("4. 🔧 Check OS notification settings");
  console.log("5. 🔄 Try incognito mode");
  
  return {
    permission: Notification.permission,
    focusState,
    browser: userAgent.includes('Chrome') ? 'Chrome' : 'Other',
    issues
  };
};

// Quick functions
window.quickVisualTest = function() {
  console.log("⚡ Quick visual test...");
  
  if (Notification.permission !== 'granted') {
    console.log("❌ Permission not granted");
    return;
  }
  
  // Test with current timestamp to avoid replacement
  const timestamp = Date.now();
  
  new Notification("⚡ QUICK TEST " + timestamp, {
    body: "Quick visual test - did you see this notification?",
    icon: "/favicon/android-chrome-192x192.png",
    requireInteraction: false,
    tag: "quick-test-" + timestamp
  });
  
  console.log("📱 Quick notification sent!");
  console.log("Focus state:", {
    visibility: document.visibilityState,
    focused: document.hasFocus()
  });
};

window.forceNotificationShow = async function() {
  console.log("🚀 Force notification show...");
  
  // Multiple approaches
  const timestamp = Date.now();
  
  // Approach 1: Basic with unique properties
  new Notification("🚀 FORCE " + timestamp, {
    body: "Force test with timestamp: " + timestamp,
    icon: "/favicon/android-chrome-192x192.png",
    tag: "force-" + timestamp,
    renotify: true
  });
  
  // Approach 2: Service worker
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    await reg.showNotification("🚀 SW FORCE " + timestamp, {
      body: "SW force test: " + timestamp,
      icon: "/favicon/android-chrome-192x192.png",
      tag: "sw-force-" + timestamp,
      renotify: true,
      vibrate: [200]
    });
  }
  
  console.log("🚀 Force notifications sent with timestamp:", timestamp);
};

console.log("👁️ Visual notification fix loaded!");
console.log("🚀 Run: fixVisualNotifications()");
console.log("⚡ Quick tests: quickVisualTest() | forceNotificationShow()");
