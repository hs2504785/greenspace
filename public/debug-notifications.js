/**
 * Notification Debug Utility
 * Add this script to your page to debug notification issues
 * Usage: Open browser console and run window.debugNotifications()
 */

window.debugNotifications = async function () {
  console.log("🔍 === NOTIFICATION DEBUG UTILITY ===");

  // 1. Check if notifications are supported
  console.log("1️⃣ Notification API Support:");
  console.log("  - 'Notification' in window:", "Notification" in window);
  console.log(
    "  - 'serviceWorker' in navigator:",
    "serviceWorker" in navigator
  );
  console.log("  - 'PushManager' in window:", "PushManager" in window);

  if (!("Notification" in window)) {
    console.error("❌ Notifications not supported in this browser");
    return;
  }

  // 2. Check current permission status
  console.log("\n2️⃣ Permission Status:");
  console.log("  - Notification.permission:", Notification.permission);

  // 3. Check service worker registration
  console.log("\n3️⃣ Service Worker Status:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log("  - Service Worker registered:", !!registration);
      console.log("  - SW scope:", registration.scope);
      console.log("  - SW active:", !!registration.active);
      console.log("  - SW installing:", !!registration.installing);
      console.log("  - SW waiting:", !!registration.waiting);

      // Check push manager
      if (registration.pushManager) {
        try {
          const permissionState =
            await registration.pushManager.permissionState({
              userVisibleOnly: true,
            });
          console.log("  - Push permission state:", permissionState);
        } catch (e) {
          console.log("  - Push permission check failed:", e.message);
        }
      }
    } else {
      console.log("  - No service worker registered");
    }
  } catch (error) {
    console.error("  - Service worker check failed:", error);
  }

  // 4. Test basic notification (if permission granted)
  console.log("\n4️⃣ Testing Basic Notification:");
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification("Debug Test", {
        body: "This is a test notification from debug utility",
        icon: "/favicon/android-chrome-192x192.png",
        tag: "debug-test",
      });

      notification.onclick = function () {
        console.log("✅ Debug notification clicked!");
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log("  - Basic notification sent!");
    } catch (error) {
      console.error("  - Basic notification failed:", error);
    }
  } else {
    console.log("  - Cannot test: Permission not granted");
  }

  // 5. Test service worker notification
  console.log("\n5️⃣ Testing Service Worker Notification:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && Notification.permission === "granted") {
      await registration.showNotification("SW Debug Test", {
        body: "This is a test notification from service worker",
        icon: "/favicon/android-chrome-192x192.png",
        tag: "sw-debug-test",
        requireInteraction: false,
      });
      console.log("  - Service worker notification sent!");
    } else {
      console.log("  - Cannot test: No SW registration or permission denied");
    }
  } catch (error) {
    console.error("  - Service worker notification failed:", error);
  }

  // 6. Browser and OS information
  console.log("\n6️⃣ Environment Information:");
  console.log("  - User Agent:", navigator.userAgent);
  console.log("  - Platform:", navigator.platform);
  console.log("  - Is Secure Context:", window.isSecureContext);
  console.log("  - Document visibility:", document.visibilityState);
  console.log("  - Window focused:", document.hasFocus());

  // 7. Test permission request flow
  console.log("\n7️⃣ Testing Permission Request:");
  if (Notification.permission === "default") {
    console.log("  - Permission is 'default', you can request permission");
    console.log("  - Run this to request permission:");
    console.log(
      "    Notification.requestPermission().then(p => console.log('New permission:', p))"
    );
  } else {
    console.log("  - Permission already decided:", Notification.permission);
  }

  // 8. Common solutions
  console.log("\n8️⃣ Common Solutions if notifications don't appear:");
  console.log(
    "  a) Check browser notification settings (chrome://settings/content/notifications)"
  );
  console.log("  b) Check OS notification settings");
  console.log("  c) Ensure site permissions allow notifications");
  console.log("  d) Try in incognito/private mode");
  console.log("  e) Try with different tab focus (background/foreground)");
  console.log("  f) Check if 'Do Not Disturb' is enabled");
  console.log("  g) Try restarting browser");
  console.log(
    "  h) Check if service worker is globally registered (should be automatic now)"
  );
  console.log("  i) Clear browser cache and reload page");

  // 9. Quick fixes
  console.log("\n9️⃣ Quick Fixes to Try:");
  console.log("  // 1. Force request permission:");
  console.log("  Notification.requestPermission().then(console.log)");
  console.log("");
  console.log("  // 2. Test immediate notification:");
  console.log(
    "  if(Notification.permission === 'granted') new Notification('Test', {body: 'Works!'})"
  );
  console.log("");
  console.log("  // 3. Force service worker registration:");
  console.log("  navigator.serviceWorker.register('/sw.js').then(console.log)");

  console.log("\n🔍 === DEBUG COMPLETE ===");
};

// Auto-run if this script is loaded directly
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log(
      "🔧 Notification debug utility loaded. Run window.debugNotifications() to start debugging."
    );
  });
} else {
  console.log(
    "🔧 Notification debug utility loaded. Run window.debugNotifications() to start debugging."
  );
}
