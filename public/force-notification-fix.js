/**
 * Force Notification Fix - Immediate Resolution
 * This script forces both badge updates and visual notifications to work
 */

window.forceNotificationFix = async function () {
  console.log("🚀 === FORCE NOTIFICATION FIX ===");

  // Step 1: Fix service worker update issue
  console.log("Step 1: Fixing service worker updates...");

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log("📊 Service worker state:", {
        active: !!registration.active,
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        scope: registration.scope,
      });

      // If there's a waiting service worker, activate it immediately
      if (registration.waiting) {
        console.log("🔄 Activating pending service worker...");
        registration.waiting.postMessage({ type: "SKIP_WAITING" });

        // Wait for controller change
        return new Promise((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("✅ Service worker activated! Reloading page...");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            resolve();
          });

          // Fallback: if no controller change in 3 seconds, continue
          setTimeout(() => {
            console.log("⏭️ Continuing without service worker reload...");
            resolve();
          }, 3000);
        });
      }
    }
  } catch (error) {
    console.error("❌ Service worker fix failed:", error);
  }

  // Step 2: Force permission
  console.log("Step 2: Ensuring notification permission...");
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("❌ Permission denied");
      alert(
        "Please enable notifications:\n1. Click the lock icon in address bar\n2. Set Notifications to 'Allow'\n3. Refresh the page"
      );
      return;
    }
  }
  console.log("✅ Permission granted");

  // Step 3: Test badge update mechanism
  console.log("Step 3: Testing badge update...");

  // Manually trigger badge update
  window.dispatchEvent(new CustomEvent("manual-notification-increment"));

  // Test service worker messaging
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      console.log("📨 Testing service worker messaging...");

      // Listen for response
      const messagePromise = new Promise((resolve) => {
        const handleMessage = (event) => {
          if (event.data?.type === "TEST_RESPONSE") {
            console.log("✅ Service worker messaging works:", event.data);
            navigator.serviceWorker.removeEventListener(
              "message",
              handleMessage
            );
            resolve(true);
          }
        };
        navigator.serviceWorker.addEventListener("message", handleMessage);

        // Timeout after 2 seconds
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener("message", handleMessage);
          resolve(false);
        }, 2000);
      });

      // Send test message
      registration.active.postMessage({
        type: "TEST_MESSAGE",
        data: "Badge update test",
      });

      const messagingWorks = await messagePromise;
      if (messagingWorks) {
        console.log("✅ Service worker messaging is working");
      } else {
        console.warn("⚠️ Service worker messaging not responding");
      }
    }
  } catch (error) {
    console.error("❌ Service worker messaging test failed:", error);
  }

  // Step 4: Force visual notification test
  console.log("Step 4: Force visual notification test...");

  const testNotifications = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error("❌ No service worker registration");
      return;
    }

    // Test 1: Force notification with requireInteraction: false
    console.log("🧪 Test 1: Force notification (requireInteraction: false)");
    await registration.showNotification("🧪 Force Test 1", {
      body: "This should appear regardless of focus",
      icon: "/favicon/android-chrome-192x192.png",
      requireInteraction: false,
      silent: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Basic notification with different tag
    console.log("🧪 Test 2: Basic notification");
    await registration.showNotification("🧪 Force Test 2", {
      body: "Basic notification test",
      icon: "/favicon/android-chrome-192x192.png",
      tag: "force-test-2",
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Exact app notification
    console.log("🧪 Test 3: Exact app notification");
    const appNotificationOptions = {
      body: 'Arya Natural Farms just added "FORCE TEST PRODUCT" to the marketplace',
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      tag: "arya-farms-notification",
      requireInteraction: false, // Changed from true to force display
      vibrate: [100, 50, 100],
    };

    await registration.showNotification(
      "🥬 FORCE: New Fresh Product Available!",
      appNotificationOptions
    );

    // Check active notifications
    const activeNotifications = await registration.getNotifications();
    console.log(
      "📋 Active notifications after tests:",
      activeNotifications.length
    );

    return activeNotifications.length > 0;
  };

  const notificationsCreated = await testNotifications();

  // Step 5: Browser-specific fixes
  console.log("Step 5: Browser-specific fixes...");

  // Check current focus state
  const focusState = {
    visibility: document.visibilityState,
    hidden: document.hidden,
    focused: document.hasFocus(),
  };

  console.log("📊 Current focus state:", focusState);

  if (focusState.focused) {
    console.warn("⚠️ CRITICAL ISSUE: Tab is focused!");
    console.log("💡 SOLUTIONS:");
    console.log("1. Switch to another tab before adding products");
    console.log("2. Minimize browser before adding products");
    console.log("3. Use a different browser/device for testing");

    // Set up focus change detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("✅ Tab is now hidden - notifications should work!");
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Auto-test when focus changes
    console.log("🔄 Setting up auto-test when you switch tabs...");
    setTimeout(() => {
      if (document.hidden) {
        console.log("🧪 Auto-testing notification in background...");
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.showNotification("🎯 Auto-Test: Background", {
              body: "This was sent when tab was in background",
              icon: "/favicon/android-chrome-192x192.png",
              requireInteraction: true,
            });
          }
        });
      }
    }, 10000);
  }

  // Step 6: Final instructions
  console.log("\n✅ FORCE FIX COMPLETE!");
  console.log("📋 RESULTS:");
  console.log(`  - Permission: ${Notification.permission}`);
  console.log(`  - Service Worker: ${registration ? "Ready" : "Missing"}`);
  console.log(`  - Notifications Created: ${notificationsCreated}`);
  console.log(
    `  - Focus State: ${focusState.focused ? "PROBLEMATIC" : "Good"}`
  );

  console.log("\n🎯 TO TEST NOTIFICATIONS:");
  console.log("1. Open this page in one tab");
  console.log("2. Open seller page in another tab");
  console.log("3. Switch to the seller tab");
  console.log("4. Add a product");
  console.log("5. Check this tab for notifications");

  if (focusState.focused) {
    console.log("\n🚨 IMPORTANT: Switch to another tab RIGHT NOW!");
    console.log("Then add a product from the seller page!");
  }

  return {
    permission: Notification.permission,
    serviceWorker: !!registration,
    notificationsCreated,
    focusState,
  };
};

// Auto-run indicator
console.log("🔧 Force notification fix loaded!");
console.log("🚀 Run: forceNotificationFix()");

// Also add to window for easy access
window.quickBadgeTest = function () {
  console.log("🧪 Quick badge test...");
  window.dispatchEvent(new CustomEvent("manual-notification-increment"));
  console.log("✅ Badge increment event sent - check header!");
};

console.log("⚡ Quick badge test: quickBadgeTest()");
