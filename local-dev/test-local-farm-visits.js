#!/usr/bin/env node

/**
 * Local Farm Visits Test Script
 *
 * Tests farm visits functionality in local development environment
 */

console.log("🧪 Testing Local Farm Visits System\n");

// Use localhost for local testing
const BASE_URL = "http://localhost:3000";

const testEndpoints = [
  {
    name: "Local Farms API (Public)",
    url: `${BASE_URL}/api/farm-visits/farms`,
    description: "Should return farms from all roles with public profiles",
  },
  {
    name: "Local Farms API (With Availability)",
    url: `${BASE_URL}/api/farm-visits/farms?hasAvailability=true`,
    description: "Should return farms that have available slots",
  },
  {
    name: "Local Availability API",
    url: `${BASE_URL}/api/farm-visits/availability`,
    description: "Should return availability slots from all roles",
  },
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Expected: ${endpoint.description}`);

    const response = await fetch(endpoint.url);

    if (!response.ok) {
      console.log(
        `   ❌ HTTP Error: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
      console.log("");
      return;
    }

    const data = await response.json();

    if (endpoint.url.includes("/api/farm-visits/farms")) {
      const farms = data.farms || [];
      console.log(`   ✅ Success: Found ${farms.length} farms`);

      // Group by role
      const roleGroups = {};
      farms.forEach((farm) => {
        if (!roleGroups[farm.role]) roleGroups[farm.role] = [];
        roleGroups[farm.role].push(farm.name);
      });

      Object.keys(roleGroups).forEach((role) => {
        console.log(`      - ${role}: ${roleGroups[role].join(", ")}`);
      });
    } else if (endpoint.url.includes("/api/farm-visits/availability")) {
      const availability = data.availability || [];
      console.log(
        `   ✅ Success: Found ${availability.length} availability slots`
      );

      // Group by seller
      const sellerGroups = {};
      availability.forEach((slot) => {
        const sellerName = slot.seller?.name || "Unknown";
        if (!sellerGroups[sellerName]) sellerGroups[sellerName] = 0;
        sellerGroups[sellerName]++;
      });

      Object.keys(sellerGroups).forEach((seller) => {
        console.log(`      - ${seller}: ${sellerGroups[seller]} slots`);
      });
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log(`   ❌ Connection Error: Local server not running`);
      console.log(`   💡 Start your dev server: npm run dev`);
    } else {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }

  console.log("");
}

async function runLocalTests() {
  console.log("🚀 Starting Local Farm Visits Tests...\n");

  // Check if local server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    console.log("✅ Local server is running\n");
  } catch (error) {
    console.log("❌ Local server is not running");
    console.log("💡 Please start your development server:");
    console.log("   npm run dev");
    console.log("   # or");
    console.log("   yarn dev");
    console.log("");
    return;
  }

  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }

  console.log("📋 Local Environment Status:");
  console.log("");
  console.log("Based on your local database check:");
  console.log("✅ Users found:");
  console.log("   - Hemant Singh (buyer)");
  console.log("   - Hemant (admin) - Has farm profile");
  console.log("   - Tanya Singh (admin) - Has visible farm profile");
  console.log(
    "   - Arya Natural Farms (superadmin) - Has visible farm profile + availability"
  );
  console.log("");
  console.log("📅 Availability:");
  console.log("   - Arya Natural Farms: 2 slots");
  console.log("");
  console.log("🔧 To fix visibility issues:");
  console.log("   Run: database/fix_local_farm_visibility.sql");
  console.log("");
  console.log("🎯 Expected after fix:");
  console.log(
    "   - All 3 users (admin + superadmin) should appear in farm listings"
  );
  console.log(
    "   - Arya Natural Farms should appear in 'with availability' filter"
  );
  console.log("   - Farm visits page should show all farms");
  console.log("");
  console.log("✅ Local Farm Visits Testing Complete!");
}

runLocalTests().catch(console.error);
