/**
 * MOBILE NOTIFICATION DIAGNOSTIC
 * Specific tests for mobile PWA notification issues
 */

window.mobileDiagnostic = async function() {
  console.log("📱 === MOBILE NOTIFICATION DIAGNOSTIC ===");
  console.log("Testing mobile-specific push notification and badge issues...\n");
  
  const results = {
    device: {},
    pwa: {},
    serviceWorker: {},
    messaging: {},
    badges: {}
  };
  
  // Step 1: Mobile Device Detection
  console.log("1️⃣ MOBILE DEVICE DETECTION:");
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const isInApp = window.navigator.userAgent.includes('wv') || window.navigator.userAgent.includes('WebView');
  
  console.log("  Is Mobile:", isMobile);
  console.log("  Is PWA/Standalone:", isStandalone);
  console.log("  Is In-App Browser:", isInApp);
  console.log("  Screen size:", window.screen.width + "x" + window.screen.height);
  console.log("  Viewport size:", window.innerWidth + "x" + window.innerHeight);
  
  results.device = { isMobile, isStandalone, isInApp, 
                     screen: `${window.screen.width}x${window.screen.height}`,
                     viewport: `${window.innerWidth}x${window.innerHeight}` };
  
  // Step 2: PWA Installation Check
  console.log("\n2️⃣ PWA INSTALLATION CHECK:");
  try {
    // Check for PWA installation prompt
    let deferredPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      deferredPrompt = e;
      console.log("📱 PWA installation prompt available");
    });
    
    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log("✅ PWA manifest found:", manifestLink.href);
      results.pwa.manifest = true;
      
      // Try to fetch manifest
      try {
        const manifestResponse = await fetch(manifestLink.href);
        const manifestData = await manifestResponse.json();
        console.log("✅ Manifest loaded:", manifestData.name || manifestData.short_name);
        results.pwa.manifestData = { name: manifestData.name, short_name: manifestData.short_name };
      } catch (e) {
        console.warn("⚠️ Could not load manifest:", e);
        results.pwa.manifestError = e.message;
      }
    } else {
      console.warn("⚠️ No PWA manifest found");
      results.pwa.manifest = false;
    }
    
    // Check service worker scope
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log("✅ Service worker scope:", registration.scope);
      results.pwa.swScope = registration.scope;
    }
    
  } catch (error) {
    console.error("❌ PWA check failed:", error);
    results.pwa.error = error.message;
  }
  
  // Step 3: Mobile-Specific Service Worker Features
  console.log("\n3️⃣ MOBILE SERVICE WORKER FEATURES:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      // Check background sync
      const hasBgSync = 'sync' in registration;
      console.log("  Background Sync:", hasBgSync ? "✅ Available" : "❌ Not available");
      
      // Check push manager
      const hasPushManager = 'pushManager' in registration;
      console.log("  Push Manager:", hasPushManager ? "✅ Available" : "❌ Not available");
      
      // Check notification API
      const hasNotifications = 'showNotification' in registration;
      console.log("  Notifications:", hasNotifications ? "✅ Available" : "❌ Not available");
      
      results.serviceWorker = { hasBgSync, hasPushManager, hasNotifications };
      
      // Test mobile-specific notification options
      if (hasNotifications) {
        console.log("📱 Testing mobile notification...");
        
        await registration.showNotification("📱 Mobile Test", {
          body: "Testing mobile PWA notification",
          icon: "/favicon/android-chrome-192x192.png",
          badge: "/favicon/android-chrome-192x192.png",
          tag: "mobile-test",
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200], // Mobile-specific
          actions: [
            { action: "open", title: "Open App" },
            { action: "close", title: "Close" }
          ],
          data: { 
            mobile: true,
            timestamp: Date.now(),
            test: "mobile-diagnostic"
          }
        });
        
        console.log("✅ Mobile notification sent - check if visible!");
        results.serviceWorker.mobileNotificationTest = "sent";
      }
      
    } else {
      console.error("❌ No service worker registration");
      results.serviceWorker.error = "No registration";
    }
    
  } catch (error) {
    console.error("❌ Mobile service worker check failed:", error);
    results.serviceWorker.error = error.message;
  }
  
  // Step 4: Real-time Badge Update Test
  console.log("\n4️⃣ REAL-TIME BADGE UPDATE TEST:");
  try {
    console.log("🔔 Testing real-time badge updates...");
    
    // Test BroadcastChannel (primary method)
    try {
      const channel = new BroadcastChannel('notification-updates');
      channel.postMessage({
        type: "NEW_NOTIFICATION",
        notification: {
          title: "Mobile Badge Test",
          body: "Testing mobile badge update",
          tag: "mobile-badge-test"
        }
      });
      console.log("✅ BroadcastChannel message sent");
      channel.close();
      results.badges.broadcastChannel = "sent";
    } catch (bcError) {
      console.warn("⚠️ BroadcastChannel failed:", bcError);
      results.badges.broadcastChannelError = bcError.message;
    }
    
    // Test manual event (fallback method)
    try {
      window.dispatchEvent(new CustomEvent("manual-notification-increment"));
      console.log("✅ Manual event dispatched");
      results.badges.manualEvent = "sent";
    } catch (eventError) {
      console.warn("⚠️ Manual event failed:", eventError);
      results.badges.manualEventError = eventError.message;
    }
    
    // Test service worker messaging
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        registration.active.postMessage({
          type: "TEST_BADGE_UPDATE",
          data: { mobile: true, timestamp: Date.now() }
        });
        console.log("✅ Service worker message sent");
        results.badges.serviceWorkerMessage = "sent";
      }
    } catch (swError) {
      console.warn("⚠️ Service worker messaging failed:", swError);
      results.badges.serviceWorkerMessageError = swError.message;
    }
    
  } catch (error) {
    console.error("❌ Badge update test failed:", error);
    results.badges.error = error.message;
  }
  
  // Step 5: Mobile Browser Specific Checks
  console.log("\n5️⃣ MOBILE BROWSER SPECIFIC CHECKS:");
  
  const userAgent = navigator.userAgent;
  const isChromeMobile = userAgent.includes('Chrome') && isMobile;
  const isFirefoxMobile = userAgent.includes('Firefox') && isMobile;
  const isSafariMobile = userAgent.includes('Safari') && isMobile && !userAgent.includes('Chrome');
  const isSamsungBrowser = userAgent.includes('SamsungBrowser');
  
  console.log("  Chrome Mobile:", isChromeMobile);
  console.log("  Firefox Mobile:", isFirefoxMobile);
  console.log("  Safari Mobile:", isSafariMobile);
  console.log("  Samsung Browser:", isSamsungBrowser);
  
  results.device.browser = {
    chrome: isChromeMobile,
    firefox: isFirefoxMobile, 
    safari: isSafariMobile,
    samsung: isSamsungBrowser
  };
  
  // Browser-specific notification issues
  if (isSafariMobile) {
    console.log("⚠️ Safari Mobile: Limited push notification support");
    console.log("   - May require user interaction");
    console.log("   - Badge updates may be restricted");
  }
  
  if (isSamsungBrowser) {
    console.log("⚠️ Samsung Browser: May have custom notification policies");
  }
  
  // Step 6: Network Connection Check
  console.log("\n6️⃣ NETWORK CONNECTION CHECK:");
  if ('connection' in navigator) {
    const connection = navigator.connection;
    console.log("  Connection Type:", connection.effectiveType);
    console.log("  Downlink:", connection.downlink + " Mbps");
    console.log("  RTT:", connection.rtt + " ms");
    console.log("  Save Data:", connection.saveData);
    
    results.device.connection = {
      type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
    
    if (connection.saveData) {
      console.log("⚠️ Data Saver mode enabled - may affect push notifications");
    }
  } else {
    console.log("  Connection API not available");
  }
  
  // Results summary
  setTimeout(() => {
    console.log("\n📱 === MOBILE DIAGNOSTIC SUMMARY ===");
    
    console.log("\n📊 MOBILE STATUS:");
    console.log("  Device Type:", results.device.isMobile ? "✅ Mobile" : "❌ Desktop");
    console.log("  PWA Mode:", results.device.isStandalone ? "✅ Standalone" : "⚠️ Browser");
    console.log("  Service Worker:", results.serviceWorker.hasNotifications ? "✅ Working" : "❌ Issues");
    console.log("  Badge Updates:", results.badges.broadcastChannel ? "✅ Sent" : "❌ Failed");
    
    console.log("\n🎯 MOBILE-SPECIFIC ISSUES:");
    
    if (!results.device.isMobile) {
      console.log("  ℹ️ Testing on desktop - mobile behavior may differ");
    }
    
    if (!results.device.isStandalone) {
      console.log("  ⚠️ Not in PWA mode - install app for better notification support");
    }
    
    if (results.device.browser.safari) {
      console.log("  🔴 Safari Mobile: Limited push notification support");
      console.log("     → Consider using iOS native app for better notifications");
    }
    
    if (results.badges.broadcastChannelError) {
      console.log("  🔴 BroadcastChannel failed on mobile:");
      console.log("     → This breaks real-time badge updates");
      console.log("     → Need alternative mobile messaging solution");
    }
    
    if (results.device.connection?.saveData) {
      console.log("  ⚠️ Data Saver mode may block background push notifications");
    }
    
    console.log("\n📋 MOBILE FIXES:");
    console.log("  1. Install as PWA for better notification support");
    console.log("  2. Disable Data Saver mode if enabled");
    console.log("  3. Check browser-specific notification settings");
    console.log("  4. Test with mobile Chrome flags enabled");
    
  }, 2000);
  
  return results;
};

// Auto-load message
console.log("📱 Mobile Notification Diagnostic loaded!");
console.log("🚀 Run: mobileDiagnostic()");
console.log("This will diagnose mobile PWA notification and badge update issues");
