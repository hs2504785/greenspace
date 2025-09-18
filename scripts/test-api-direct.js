#!/usr/bin/env node

/**
 * Direct API Test Script
 * Tests the farm visit APIs using Node.js fetch
 */

async function testAPI() {
  console.log("🧪 Testing Farm Visit APIs...\n");

  const apis = [
    { name: "Database Test", url: "http://localhost:3001/api/test-db" },
    {
      name: "Requests API",
      url: "http://localhost:3001/api/farm-visits/requests",
    },
    {
      name: "Availability API",
      url: "http://localhost:3001/api/farm-visits/availability",
    },
    { name: "Farms API", url: "http://localhost:3001/api/farm-visits/farms" },
  ];

  for (const api of apis) {
    try {
      console.log(`📡 Testing ${api.name}...`);

      const response = await fetch(api.url);
      const data = await response.text();

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(
        `   Response: ${data.substring(0, 200)}${
          data.length > 200 ? "..." : ""
        }`
      );
      console.log("");
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log("");
    }
  }
}

testAPI().catch(console.error);
