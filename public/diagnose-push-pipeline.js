/**
 * COMPREHENSIVE PUSH NOTIFICATION PIPELINE DIAGNOSTIC
 * Tests the entire flow: Subscription → Server → Push Service → Service Worker → Display
 */

window.diagnosePushPipeline = async function() {
  console.log("🔍 === COMPREHENSIVE PUSH PIPELINE DIAGNOSTIC ===");
  console.log("Testing ENTIRE push notification flow from subscription to display...\n");
  
  const results = {
    vapidKeys: {},
    subscription: {},
    serviceWorker: {},
    server: {},
    pushService: {},
    display: {}
  };
  
  // Step 1: Check VAPID configuration
  console.log("1️⃣ VAPID KEYS CHECK:");
  try {
    const vapidPublicKey = process?.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
                          window.ENV?.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
                          localStorage.getItem('vapid_public_key');
    
    if (!vapidPublicKey) {
      console.error("❌ VAPID public key not found!");
      console.log("🔧 Check environment variables or localStorage");
      results.vapidKeys.error = "VAPID public key missing";
    } else {
      console.log("✅ VAPID public key found:", vapidPublicKey.substring(0, 20) + "...");
      results.vapidKeys.publicKey = vapidPublicKey.substring(0, 20) + "...";
      results.vapidKeys.status = "found";
    }
  } catch (error) {
    console.error("❌ VAPID check failed:", error);
    results.vapidKeys.error = error.message;
  }
  
  // Step 2: Service Worker Registration Check
  console.log("\n2️⃣ SERVICE WORKER REGISTRATION:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error("❌ No service worker registration found!");
      results.serviceWorker.error = "No registration";
      return results;
    }
    
    console.log("✅ Service worker registered");
    console.log("  Scope:", registration.scope);
    console.log("  State:", registration.active?.state);
    
    results.serviceWorker.status = "registered";
    results.serviceWorker.scope = registration.scope;
    results.serviceWorker.state = registration.active?.state;
    
    // Check push manager
    if (!registration.pushManager) {
      console.error("❌ Push manager not available!");
      results.serviceWorker.pushManager = false;
      return results;
    }
    
    console.log("✅ Push manager available");
    results.serviceWorker.pushManager = true;
    
  } catch (error) {
    console.error("❌ Service worker check failed:", error);
    results.serviceWorker.error = error.message;
    return results;
  }
  
  // Step 3: Push Subscription Check
  console.log("\n3️⃣ PUSH SUBSCRIPTION CHECK:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (!existingSubscription) {
      console.warn("⚠️ No existing push subscription found");
      console.log("🔧 Attempting to create new subscription...");
      
      // Try to create subscription
      const vapidPublicKey = 'BMOKJOdlFaIH2FWUSz0rNhxhTiGRoOe0N4VN3WZtmKF8hl5x8qoEa0SeLgOCyE7jOp-1xPQ_yHGlVi9a5aWzDAs';
      
      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
        
        console.log("✅ New subscription created!");
        console.log("  Endpoint:", newSubscription.endpoint.substring(0, 50) + "...");
        
        results.subscription.status = "created";
        results.subscription.endpoint = newSubscription.endpoint.substring(0, 50) + "...";
        results.subscription.keys = {
          p256dh: newSubscription.getKey('p256dh') ? 'present' : 'missing',
          auth: newSubscription.getKey('auth') ? 'present' : 'missing'
        };
        
      } catch (subscribeError) {
        console.error("❌ Failed to create subscription:", subscribeError);
        results.subscription.error = subscribeError.message;
        return results;
      }
      
    } else {
      console.log("✅ Existing subscription found");
      console.log("  Endpoint:", existingSubscription.endpoint.substring(0, 50) + "...");
      
      results.subscription.status = "existing";
      results.subscription.endpoint = existingSubscription.endpoint.substring(0, 50) + "...";
      results.subscription.keys = {
        p256dh: existingSubscription.getKey('p256dh') ? 'present' : 'missing',
        auth: existingSubscription.getKey('auth') ? 'present' : 'missing'
      };
    }
    
  } catch (error) {
    console.error("❌ Subscription check failed:", error);
    results.subscription.error = error.message;
    return results;
  }
  
  // Step 4: Server API Check
  console.log("\n4️⃣ SERVER API CHECK:");
  try {
    // Test if our notification API is working
    const testResponse = await fetch('/api/debug/manual-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: 'diagnostic-test',
        testMode: true 
      })
    });
    
    if (!testResponse.ok) {
      const errorData = await testResponse.text();
      console.error("❌ Server API failed:", testResponse.status, errorData);
      results.server.error = `${testResponse.status}: ${errorData}`;
    } else {
      const responseData = await testResponse.json();
      console.log("✅ Server API responding");
      console.log("  Response:", responseData.message || responseData.error);
      
      results.server.status = "working";
      results.server.response = responseData.message || responseData.error;
    }
    
  } catch (error) {
    console.error("❌ Server API check failed:", error);
    results.server.error = error.message;
  }
  
  // Step 5: Database Subscription Check
  console.log("\n5️⃣ DATABASE SUBSCRIPTION CHECK:");
  try {
    // Check if push subscriptions are stored in database
    const subResponse = await fetch('/api/notifications/subscribe', {
      method: 'GET'
    });
    
    if (subResponse.ok) {
      const subData = await subResponse.json();
      console.log("✅ Database subscription API working");
      console.log("  Active subscriptions:", subData.subscriptions?.length || 'unknown');
      
      results.database = {
        status: "working",
        subscriptions: subData.subscriptions?.length || 0
      };
    } else {
      console.warn("⚠️ Database subscription check failed:", subResponse.status);
      results.database = { error: `HTTP ${subResponse.status}` };
    }
    
  } catch (error) {
    console.warn("⚠️ Database subscription check failed:", error);
    results.database = { error: error.message };
  }
  
  // Step 6: Live Push Test
  console.log("\n6️⃣ LIVE PUSH TEST:");
  try {
    console.log("🧪 Sending live push notification...");
    
    const pushResponse = await fetch('/api/debug/manual-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (pushResponse.ok) {
      const pushData = await pushResponse.json();
      console.log("✅ Push sent successfully!");
      console.log("  Server response:", pushData.message);
      
      results.pushService.status = "sent";
      results.pushService.response = pushData.message;
      
      // Wait for notification to arrive
      console.log("⏰ Waiting 5 seconds for notification...");
      
      let notificationReceived = false;
      const startTime = Date.now();
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_RECEIVED') {
          notificationReceived = true;
          console.log("✅ Push notification received by service worker!");
          results.display.status = "received";
        }
      });
      
      setTimeout(() => {
        if (!notificationReceived) {
          console.warn("⚠️ No push notification received in 5 seconds");
          console.log("🔍 This suggests push delivery failure");
          results.display.status = "not_received";
        }
      }, 5000);
      
    } else {
      const errorData = await pushResponse.json();
      console.error("❌ Push test failed:", errorData.error);
      results.pushService.error = errorData.error;
    }
    
  } catch (error) {
    console.error("❌ Live push test failed:", error);
    results.pushService.error = error.message;
  }
  
  // Step 7: Results Summary
  setTimeout(() => {
    console.log("\n🔍 === DIAGNOSTIC RESULTS SUMMARY ===");
    
    console.log("\n📊 PIPELINE STATUS:");
    console.log("  VAPID Keys:", results.vapidKeys.status || "❌ FAILED");
    console.log("  Service Worker:", results.serviceWorker.status || "❌ FAILED");
    console.log("  Push Subscription:", results.subscription.status || "❌ FAILED");
    console.log("  Server API:", results.server.status || "❌ FAILED");
    console.log("  Database:", results.database?.status || "❌ FAILED");
    console.log("  Push Delivery:", results.pushService.status || "❌ FAILED");
    console.log("  Display:", results.display.status || "⏳ WAITING");
    
    console.log("\n🎯 LIKELY ISSUES:");
    
    if (results.vapidKeys.error) {
      console.log("  🔴 VAPID CONFIGURATION: Missing or invalid VAPID keys");
      console.log("     → Check environment variables");
      console.log("     → Verify VAPID key generation");
    }
    
    if (results.subscription.error) {
      console.log("  🔴 PUSH SUBSCRIPTION: Cannot create push subscription");
      console.log("     → Check browser permissions");
      console.log("     → Verify VAPID public key");
    }
    
    if (results.server.error) {
      console.log("  🔴 SERVER API: Backend push API not working");
      console.log("     → Check server logs");
      console.log("     → Verify VAPID private key on server");
    }
    
    if (results.pushService.error) {
      console.log("  🔴 PUSH DELIVERY: Push messages not being delivered");
      console.log("     → Check push service connectivity");
      console.log("     → Verify subscription validity");
    }
    
    if (results.display.status === "not_received") {
      console.log("  🔴 PUSH RECEPTION: Service worker not receiving push events");
      console.log("     → Check service worker push event handler");
      console.log("     → Verify network connectivity to push service");
    }
    
    console.log("\n📋 NEXT STEPS:");
    console.log("  1. Fix any 🔴 CRITICAL issues first");
    console.log("  2. Re-run this diagnostic after each fix");
    console.log("  3. Check server logs for push delivery errors");
    console.log("  4. Test on different devices/browsers");
    
  }, 6000);
  
  return results;
};

// Quick VAPID key checker
window.checkVapidKeys = function() {
  console.log("🔧 Checking VAPID key configuration...");
  
  const sources = [
    { name: "process.env", value: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY : null },
    { name: "window.ENV", value: window.ENV?.NEXT_PUBLIC_VAPID_PUBLIC_KEY },
    { name: "localStorage", value: localStorage.getItem('vapid_public_key') },
    { name: "hardcoded", value: 'BMOKJOdlFaIH2FWUSz0rNhxhTiGRoOe0N4VN3WZtmKF8hl5x8qoEa0SeLgOCyE7jOp-1xPQ_yHGlVi9a5aWzDAs' }
  ];
  
  sources.forEach(source => {
    if (source.value) {
      console.log(`✅ ${source.name}:`, source.value.substring(0, 20) + "...");
    } else {
      console.log(`❌ ${source.name}: Not found`);
    }
  });
};

// Auto-load message
console.log("🔍 Push Pipeline Diagnostic loaded!");
console.log("🚀 Run: diagnosePushPipeline()");
console.log("🔧 Check VAPID: checkVapidKeys()");
console.log("This will identify the EXACT point of failure in your push notification pipeline");
