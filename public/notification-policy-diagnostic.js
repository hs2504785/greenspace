/**
 * Notification Policy Diagnostic
 * Identifies EXACTLY why visual notifications are blocked despite working badge counts
 */

window.notificationPolicyDiagnostic = async function() {
  console.log("🔍 === NOTIFICATION POLICY DIAGNOSTIC ===");
  console.log("Finding out WHY visual notifications don't appear...\n");
  
  const results = {
    technical: {},
    policies: {},
    blockers: [],
    solutions: []
  };
  
  // Step 1: Technical Status (Should all be working)
  console.log("1️⃣ TECHNICAL STATUS (Should all be ✅):");
  
  results.technical.notificationSupport = 'Notification' in window;
  results.technical.serviceWorkerSupport = 'serviceWorker' in navigator;
  results.technical.permission = Notification.permission;
  
  console.log(`  Notification API: ${results.technical.notificationSupport ? '✅' : '❌'}`);
  console.log(`  Service Worker: ${results.technical.serviceWorkerSupport ? '✅' : '❌'}`);
  console.log(`  Permission: ${results.technical.permission} ${results.technical.permission === 'granted' ? '✅' : '❌'}`);
  
  // Check service worker registration
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    results.technical.serviceWorkerRegistered = !!registration;
    console.log(`  SW Registered: ${results.technical.serviceWorkerRegistered ? '✅' : '❌'}`);
    
    if (registration) {
      results.technical.serviceWorkerState = registration.active?.state;
      console.log(`  SW State: ${results.technical.serviceWorkerState} ${results.technical.serviceWorkerState === 'activated' ? '✅' : '❌'}`);
    }
  } catch (error) {
    results.technical.serviceWorkerError = error.message;
    console.log(`  SW Registration: ❌ ${error.message}`);
  }
  
  // Step 2: Display Policies (These cause the blocking)
  console.log("\n2️⃣ DISPLAY POLICIES (These block visual notifications):");
  
  // Focus state
  results.policies.documentVisible = document.visibilityState === 'visible';
  results.policies.documentFocused = document.hasFocus();
  results.policies.documentHidden = document.hidden;
  
  console.log(`  Tab Visible: ${results.policies.documentVisible}`);
  console.log(`  Tab Focused: ${results.policies.documentFocused}`);
  console.log(`  Tab Hidden: ${results.policies.documentHidden}`);
  
  if (results.policies.documentFocused && results.policies.documentVisible) {
    results.blockers.push({
      type: "FOCUS_STATE",
      severity: "HIGH", 
      description: "Tab is active and focused - Chrome suppresses visual notifications",
      solution: "Switch to another tab before adding products"
    });
  }
  
  // Browser detection
  const userAgent = navigator.userAgent;
  results.policies.isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
  results.policies.isFirefox = userAgent.includes('Firefox');
  results.policies.isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  results.policies.isEdge = userAgent.includes('Edg');
  
  console.log(`  Browser: ${results.policies.isChrome ? 'Chrome' : results.policies.isFirefox ? 'Firefox' : results.policies.isSafari ? 'Safari' : results.policies.isEdge ? 'Edge' : 'Other'}`);
  
  // Chrome-specific policies
  if (results.policies.isChrome) {
    console.log("  Chrome Focus Policy: Active tabs suppress visual notifications ⚠️");
    if (results.policies.documentFocused) {
      results.blockers.push({
        type: "CHROME_FOCUS_POLICY",
        severity: "HIGH",
        description: "Chrome suppresses notifications in active tabs",
        solution: "Test with tab in background or minimized"
      });
    }
  }
  
  // Platform detection
  results.policies.platform = navigator.platform;
  results.policies.isMac = results.policies.platform.includes('Mac');
  results.policies.isWindows = results.policies.platform.includes('Win');
  results.policies.isLinux = results.policies.platform.includes('Linux');
  
  console.log(`  Platform: ${results.policies.platform}`);
  
  // Security context
  results.policies.isSecure = window.isSecureContext;
  results.policies.protocol = location.protocol;
  results.policies.isHttps = results.policies.protocol === 'https:';
  results.policies.isLocalhost = location.hostname === 'localhost';
  
  console.log(`  Secure Context: ${results.policies.isSecure ? '✅' : '❌'}`);
  console.log(`  Protocol: ${results.policies.protocol} ${results.policies.isHttps || results.policies.isLocalhost ? '✅' : '❌'}`);
  
  if (!results.policies.isSecure) {
    results.blockers.push({
      type: "INSECURE_CONTEXT",
      severity: "CRITICAL",
      description: "Notifications require secure context (HTTPS)",
      solution: "Use HTTPS or localhost"
    });
  }
  
  // Step 3: Hidden Settings Detection
  console.log("\n3️⃣ HIDDEN SETTINGS DETECTION:");
  
  // Check if in iframe
  results.policies.inIframe = window !== window.top;
  console.log(`  In iframe: ${results.policies.inIframe ? '❌' : '✅'}`);
  
  if (results.policies.inIframe) {
    results.blockers.push({
      type: "IFRAME_RESTRICTION",
      severity: "HIGH", 
      description: "Running in iframe - notifications may be blocked",
      solution: "Test in main window, not iframe"
    });
  }
  
  // Check for Do Not Disturb indicators
  const currentHour = new Date().getHours();
  if (currentHour >= 22 || currentHour <= 7) {
    results.blockers.push({
      type: "QUIET_HOURS",
      severity: "MEDIUM",
      description: "Current time suggests possible Do Not Disturb mode",
      solution: "Check OS notification/Do Not Disturb settings"
    });
  }
  
  // Step 4: Live Visual Test with Policy Detection
  console.log("\n4️⃣ LIVE VISUAL TEST:");
  
  if (results.technical.permission === 'granted') {
    console.log("Testing visual notification with policy detection...");
    
    const testStartTime = Date.now();
    const testId = 'policy-test-' + testStartTime;
    
    try {
      // Create test notification
      const testNotification = new Notification("🧪 POLICY TEST", {
        body: `Policy test at ${new Date().toLocaleTimeString()}`,
        icon: "/favicon/android-chrome-192x192.png",
        tag: testId,
        requireInteraction: false,
        silent: false
      });
      
      let notificationSeen = false;
      let notificationClicked = false;
      
      // Listen for interaction
      testNotification.onclick = () => {
        notificationClicked = true;
        console.log("✅ VISUAL NOTIFICATION CLICKED - It appeared!");
        testNotification.close();
      };
      
      // Check if notification appears by testing click after delay
      setTimeout(() => {
        if (!notificationClicked) {
          console.log("❌ No click detected - notification likely not visible");
          results.policies.visuallyBlocked = true;
        }
        testNotification.close();
      }, 5000);
      
      console.log("📱 Test notification created - watch for it!");
      console.log("👆 Click it if you see it to confirm visibility");
      
    } catch (error) {
      console.error("❌ Visual test failed:", error);
      results.policies.visualTestError = error.message;
    }
  } else {
    console.log("❌ Cannot test - permission not granted");
  }
  
  // Step 5: Policy Analysis
  console.log("\n5️⃣ POLICY ANALYSIS:");
  
  console.log("\n🔴 BLOCKERS FOUND:");
  if (results.blockers.length === 0) {
    console.log("  No obvious policy blockers detected");
  } else {
    results.blockers.forEach((blocker, i) => {
      console.log(`  ${i + 1}. [${blocker.severity}] ${blocker.type}:`);
      console.log(`     ${blocker.description}`);
      console.log(`     💡 ${blocker.solution}`);
    });
  }
  
  // Step 6: Specific Solutions
  console.log("\n6️⃣ SPECIFIC SOLUTIONS FOR YOUR SETUP:");
  
  if (results.policies.isChrome && results.policies.documentFocused) {
    console.log("\n🎯 PRIMARY SOLUTION (Chrome + Active Tab):");
    console.log("  1. Open buyer page in Tab 1");
    console.log("  2. Open seller page in Tab 2"); 
    console.log("  3. Switch to Tab 2 (seller)");
    console.log("  4. Add a product");
    console.log("  5. Check Tab 1 - notification should appear");
    
    results.solutions.push("Use background tab testing");
  }
  
  if (results.policies.isChrome) {
    console.log("\n🔧 CHROME SETTINGS CHECK:");
    console.log("  1. Go to: chrome://settings/content/notifications");
    console.log("  2. Find: " + location.hostname);
    console.log("  3. Ensure: Set to 'Allow'");
    console.log("  4. Check: No additional restrictions");
    
    results.solutions.push("Verify Chrome notification settings");
  }
  
  if (results.policies.isMac) {
    console.log("\n🍎 MACOS SETTINGS CHECK:");
    console.log("  1. System Preferences → Notifications");
    console.log("  2. Find: Chrome (or your browser)");
    console.log("  3. Enable: Allow Notifications");
    console.log("  4. Disable: Do Not Disturb");
    
    results.solutions.push("Check macOS notification settings");
  } else if (results.policies.isWindows) {
    console.log("\n🪟 WINDOWS SETTINGS CHECK:");
    console.log("  1. Settings → System → Notifications & actions");
    console.log("  2. Enable: Get notifications from apps");
    console.log("  3. Find: Chrome (or your browser)");
    console.log("  4. Enable: Show notifications");
    
    results.solutions.push("Check Windows notification settings");
  }
  
  // Step 7: Automated Background Test Setup
  console.log("\n7️⃣ AUTOMATED BACKGROUND TEST:");
  
  if (results.policies.documentFocused) {
    console.log("⏰ Setting up test for when you switch tabs...");
    console.log("💨 Switch to another tab within 10 seconds!");
    
    let backgroundTestTriggered = false;
    
    const backgroundTest = () => {
      if (!backgroundTestTriggered && document.hidden) {
        backgroundTestTriggered = true;
        console.log("🎯 Tab is now hidden - testing background notification!");
        
        new Notification("🎯 BACKGROUND POLICY TEST", {
          body: "This notification was sent when tab was in background. Did it appear?",
          icon: "/favicon/android-chrome-192x192.png",
          requireInteraction: true,
          tag: "background-policy-test-" + Date.now(),
          vibrate: [200, 100, 200]
        });
        
        console.log("📱 Background notification sent!");
        console.log("👀 Check if you see the visual notification now!");
        
        document.removeEventListener('visibilitychange', backgroundTest);
      }
    };
    
    document.addEventListener('visibilitychange', backgroundTest);
    
    setTimeout(() => {
      if (!backgroundTestTriggered) {
        console.log("⏰ No tab switch detected - try switching tabs manually");
        document.removeEventListener('visibilitychange', backgroundTest);
      }
    }, 10000);
  }
  
  console.log("\n✅ DIAGNOSTIC COMPLETE!");
  console.log("\n📋 SUMMARY:");
  console.log(`  Technical Issues: ${results.technical.permission !== 'granted' ? '❌' : '✅'}`);
  console.log(`  Policy Blockers: ${results.blockers.length} found`);
  console.log(`  Primary Cause: ${results.blockers.length > 0 ? results.blockers[0].type : 'Unknown'}`);
  
  return results;
};

// Auto-load message
console.log("🔍 Notification Policy Diagnostic loaded!");
console.log("🚀 Run: notificationPolicyDiagnostic()");
console.log("This will find EXACTLY why visual notifications are blocked");
