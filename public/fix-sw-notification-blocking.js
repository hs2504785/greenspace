/**
 * Fix Chrome Service Worker Notification Blocking
 * Targeted solution for when direct notifications work but service worker notifications don't
 */

window.fixServiceWorkerNotificationBlocking = function () {
  console.log("🔧 === FIX CHROME SERVICE WORKER NOTIFICATION BLOCKING ===");
  console.log(
    "Diagnosis: Direct notifications work, service worker notifications blocked\n"
  );

  console.log("🎯 CHROME SPECIFIC SERVICE WORKER FIXES:");

  // Chrome service worker notification settings
  console.log("\n1️⃣ CHROME SERVICE WORKER NOTIFICATION SETTINGS:");
  console.log("📍 Go to: chrome://settings/content/notifications");
  console.log("🔍 Look for these SERVICE WORKER specific settings:");
  console.log("   ❌ 'Use quieter messaging for notifications' ← DISABLE THIS");
  console.log(
    "   ❌ 'Only show notifications when Chrome is in the background' ← DISABLE THIS"
  );
  console.log("   ❌ 'Block notifications that interrupt you' ← DISABLE THIS");
  console.log(
    "   ❌ Any mention of 'service worker' restrictions ← DISABLE ALL"
  );

  console.log("\n📍 SPECIFIC STEPS:");
  console.log(
    "   1. Click 'Sites can ask to send notifications' (should be enabled)"
  );
  console.log("   2. Scroll down to find 'Additional settings' or 'Advanced'");
  console.log("   3. Look for 'Notification behavior' section");
  console.log("   4. DISABLE 'Use quieter messaging'");
  console.log("   5. DISABLE any 'background only' restrictions");

  // Chrome flags for service workers
  console.log("\n2️⃣ CHROME FLAGS FOR SERVICE WORKERS:");
  console.log("📍 Go to: chrome://flags/");
  console.log("🔍 Search and ENABLE these flags:");
  console.log("   ✅ #enable-experimental-web-platform-features");
  console.log("   ✅ #enable-push-messaging");
  console.log("   ✅ #enable-notifications");
  console.log("   ✅ #enable-service-worker-payment-apps");
  console.log("💡 After changing flags, RESTART Chrome");

  // Site-specific service worker settings
  console.log("\n3️⃣ SITE-SPECIFIC SERVICE WORKER SETTINGS:");
  console.log("📍 Go to: chrome://settings/content/all");
  console.log("🔍 Search for: aryanaturalfarms.vercel.app");
  console.log("📝 Actions:");
  console.log("   1. Click on the site");
  console.log("   2. Find 'Notifications' setting");
  console.log("   3. Change from 'Allow' to 'Ask (default)'");
  console.log("   4. Refresh your site");
  console.log(
    "   5. Grant permission again (this resets service worker permissions)"
  );
  console.log("   6. Change back to 'Allow'");

  // Test after each fix
  console.log("\n4️⃣ TEST AFTER EACH FIX:");
  console.log("After making each change above, test with:");
  console.log("   testSWNotificationNow(); // Quick service worker test");
  console.log("   testServiceWorkerNotifications(); // Full diagnostic");

  // Advanced Chrome developer fixes
  console.log("\n5️⃣ ADVANCED CHROME DEVELOPER FIXES:");
  console.log("📍 In Chrome DevTools:");
  console.log("   1. F12 → Application tab → Service Workers");
  console.log("   2. Check 'Update on reload'");
  console.log("   3. Click 'Unregister' then refresh page");
  console.log("   4. Re-register service worker with fresh permissions");

  console.log("\n📍 Chrome Notification Console:");
  console.log("   1. F12 → Console");
  console.log(
    "   2. Run: Notification.requestPermission().then(p => console.log('SW Permission:', p))"
  );
  console.log("   3. Should show 'granted' - if not, permission issue");

  // Chrome reset option
  console.log("\n6️⃣ NUCLEAR OPTION - CHROME RESET:");
  console.log("📍 If nothing else works:");
  console.log("   1. Chrome → Settings → Advanced → Reset and clean up");
  console.log("   2. 'Restore settings to original defaults'");
  console.log("   3. This resets ALL notification settings");
  console.log("   4. Re-visit site and grant permissions fresh");

  return {
    chromeSettings: "chrome://settings/content/notifications",
    chromeFlags: "chrome://flags/",
    siteSettings: "chrome://settings/content/all",
    testFunction: "testSWNotificationNow()",
  };
};

// Automated Chrome settings opener
window.openChromeNotificationSettings = function () {
  console.log("🔧 Opening Chrome notification settings...");

  // Open all relevant Chrome settings
  window.open("chrome://settings/content/notifications", "_blank");

  setTimeout(() => {
    console.log("\n📍 IN THE OPENED TAB:");
    console.log("1. Scroll down to find 'Use quieter messaging'");
    console.log("2. TURN OFF 'Use quieter messaging for notifications'");
    console.log(
      "3. Look for any 'background only' or service worker restrictions"
    );
    console.log("4. DISABLE all service worker notification restrictions");
    console.log("\n⏰ After making changes, come back and run:");
    console.log("testSWNotificationNow()");
  }, 2000);
};

// Test service worker notifications immediately after fix
window.testAfterChromeSettingsFix = async function () {
  console.log(
    "🧪 Testing service worker notifications after Chrome settings fix..."
  );

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error("❌ No service worker registration");
      return;
    }

    console.log("📡 Testing service worker notification...");

    await registration.showNotification("🔧 CHROME SETTINGS FIX TEST", {
      body: "Service worker notification after Chrome settings fix - did this appear?",
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: "chrome-fix-test-" + Date.now(),
    });

    console.log("✅ Service worker notification sent!");
    console.log("👀 CHECK: Did you see the notification visually?");
    console.log(
      "💡 If YES: Chrome settings fixed! Add product should now work."
    );
    console.log("💡 If NO: Try the Chrome flags fix next.");
  } catch (error) {
    console.error("❌ Service worker notification failed:", error);
    console.log("💡 Try the Chrome flags fix: chrome://flags/");
  }
};

// Reset service worker registration completely
window.resetServiceWorkerRegistration = async function () {
  console.log("🔄 Resetting service worker registration...");

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log("✅ Service worker unregistered");
    }

    // Force reload to re-register
    setTimeout(() => {
      console.log("🔄 Reloading page to re-register service worker...");
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error("❌ Failed to reset service worker:", error);
  }
};

// Auto-load message
console.log("🔧 Chrome Service Worker Notification Fix loaded!");
console.log("🚀 Primary fix: fixServiceWorkerNotificationBlocking()");
console.log("⚡ Quick settings: openChromeNotificationSettings()");
console.log("🧪 Test after fix: testAfterChromeSettingsFix()");
console.log("🔄 Reset SW: resetServiceWorkerRegistration()");
console.log(
  "\nThis fixes Chrome blocking service worker notifications while allowing direct notifications"
);
