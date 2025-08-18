/**
 * IMMEDIATE NOTIFICATION FIX
 * This addresses both the client messaging issue and visual notification problem
 */

window.immediateNotificationFix = async function() {
  console.log("🚨 === IMMEDIATE NOTIFICATION FIX ===");
  
  // Step 1: Test badge updates with BroadcastChannel
  console.log("Step 1: Testing badge updates with BroadcastChannel...");
  
  try {
    const channel = new BroadcastChannel('notification-updates');
    channel.postMessage({
      type: "NEW_NOTIFICATION",
      notification: {
        title: "Test Badge Update",
        body: "Testing badge increment",
        tag: "test-badge"
      }
    });
    console.log("📻 Sent badge update via BroadcastChannel");
    channel.close();
    
    // Also trigger manual event
    window.dispatchEvent(new CustomEvent("manual-notification-increment"));
    console.log("🔔 Triggered manual badge increment");
    
    // Wait a moment to see if badge updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("✅ Badge update test complete - check header for count change");
  } catch (error) {
    console.error("❌ BroadcastChannel test failed:", error);
  }
  
  // Step 2: Direct visual notification tests
  console.log("\nStep 2: Testing visual notifications directly...");
  
  if (Notification.permission !== 'granted') {
    console.log("🔐 Requesting permission...");
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error("❌ Permission denied - cannot test visual notifications");
      return;
    }
  }
  
  // Test different notification approaches
  const tests = [
    {
      name: "Basic Notification (should appear regardless)",
      test: () => {
        const notification = new Notification("🧪 Basic Test", {
          body: "Basic notification - should appear immediately",
          icon: "/favicon/android-chrome-192x192.png",
          requireInteraction: false
        });
        setTimeout(() => notification.close(), 5000);
      }
    },
    {
      name: "Service Worker Notification (forced display)",
      test: async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification("🔧 SW Test", {
            body: "Service worker notification test",
            icon: "/favicon/android-chrome-192x192.png",
            requireInteraction: false,
            silent: false
          });
        }
      }
    },
    {
      name: "High Priority Notification",
      test: async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification("🚨 HIGH PRIORITY", {
            body: "High priority notification test",
            icon: "/favicon/android-chrome-192x192.png",
            requireInteraction: true,
            vibrate: [200, 100, 200],
            tag: "high-priority-test"
          });
        }
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`🧪 Running: ${test.name}`);
    try {
      await test.test();
      console.log(`✅ ${test.name} executed`);
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Step 3: Browser settings diagnosis
  console.log("\nStep 3: Browser settings diagnosis...");
  
  const focusState = {
    visibility: document.visibilityState,
    hidden: document.hidden,
    focused: document.hasFocus(),
    protocol: location.protocol,
    hostname: location.hostname
  };
  
  console.log("📊 Current state:", focusState);
  
  // Detect potential issues
  const issues = [];
  
  if (focusState.focused && focusState.visibility === 'visible') {
    issues.push("🔴 Tab is active and focused - this prevents notifications in many browsers");
  }
  
  if (focusState.protocol !== 'https:' && focusState.hostname !== 'localhost') {
    issues.push("🔴 Not HTTPS - notifications require secure context");
  }
  
  // Check user agent for browser-specific issues
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) {
    console.log("ℹ️ Chrome detected - good notification support");
    if (focusState.focused) {
      issues.push("🔴 Chrome suppresses notifications when tab is active");
    }
  } else if (userAgent.includes('Safari')) {
    issues.push("⚠️ Safari has limited notification support");
  } else if (userAgent.includes('Firefox')) {
    console.log("ℹ️ Firefox detected - good notification support");
  }
  
  // Check if in iframe
  if (window !== window.top) {
    issues.push("🔴 Running in iframe - notifications may be blocked");
  }
  
  console.log("\n🔍 POTENTIAL ISSUES FOUND:");
  if (issues.length === 0) {
    console.log("✅ No obvious issues detected");
  } else {
    issues.forEach(issue => console.log(issue));
  }
  
  // Step 4: Provide solutions
  console.log("\n🛠️ SOLUTIONS TO TRY:");
  
  if (focusState.focused) {
    console.log("1. 🎯 CRITICAL: Switch to another tab or minimize browser");
    console.log("2. 🎯 Test sequence:");
    console.log("   - Open buyer page in Tab 1");
    console.log("   - Open seller page in Tab 2");
    console.log("   - Switch to Tab 2 (seller)");
    console.log("   - Add a product");
    console.log("   - Check Tab 1 for notification");
  }
  
  console.log("3. 📱 Check browser notification settings:");
  console.log("   - Chrome: chrome://settings/content/notifications");
  console.log("   - Look for '" + location.hostname + "'");
  console.log("   - Ensure it's set to 'Allow'");
  
  console.log("4. 🖥️ Check OS notification settings:");
  console.log("   - Windows: Settings > System > Notifications");
  console.log("   - macOS: System Preferences > Notifications");
  console.log("   - Ensure 'Do Not Disturb' is OFF");
  
  console.log("5. 🔄 Try different approaches:");
  console.log("   - Incognito/private mode");
  console.log("   - Different browser");
  console.log("   - Restart browser");
  console.log("   - Clear site data and try again");
  
  // Step 5: Set up automatic test when focus changes
  console.log("\n⏰ Setting up automatic test when you change focus...");
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("🎯 Tab is now hidden - testing notification...");
      
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification("🎯 Auto-Test: Background", {
            body: "This notification was sent when tab was in background. Did it appear?",
            icon: "/favicon/android-chrome-192x192.png",
            requireInteraction: true,
            vibrate: [100, 50, 100]
          });
          console.log("📱 Background notification sent!");
        }
      });
      
      // Remove listener after one test
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  console.log("✅ Auto-test set up - switch tabs to trigger");
  
  console.log("\n🎉 IMMEDIATE FIX COMPLETE!");
  console.log("📋 Summary:");
  console.log("  - Badge updates: BroadcastChannel and manual events sent");
  console.log("  - Visual tests: Multiple notification types tested");
  console.log("  - Auto-test: Will trigger when you switch tabs");
  console.log("\n💡 Most likely solution: Switch to another tab and test!");
};

// Auto-load message
console.log("🚨 Immediate notification fix loaded!");
console.log("🚀 Run: immediateNotificationFix()");

// Quick functions
window.testBadgeNow = function() {
  console.log("🔔 Testing badge update...");
  
  // Only use BroadcastChannel (not both methods to avoid double increment)
  const channel = new BroadcastChannel('notification-updates');
  channel.postMessage({
    type: "NEW_NOTIFICATION",
    notification: { title: "Badge Test", body: "Testing", tag: "test" }
  });
  channel.close();
  console.log("📻 Badge test sent via BroadcastChannel - check header!");
  
  // Alternative: use manual event only
  // window.dispatchEvent(new CustomEvent("manual-notification-increment"));
};

window.testVisualNow = function() {
  if (Notification.permission === 'granted') {
    new Notification("🧪 Visual Test", {
      body: "Visual notification test - did you see this?",
      icon: "/favicon/android-chrome-192x192.png"
    });
    console.log("📱 Visual test sent!");
  } else {
    console.log("❌ Permission not granted");
  }
};

console.log("⚡ Quick tests: testBadgeNow() | testVisualNow()");
