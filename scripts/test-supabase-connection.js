#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 * Tests basic connectivity to Supabase
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔗 Testing Supabase Connection...\n");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

console.log("📍 Supabase URL:", supabaseUrl);
console.log("🔑 Using key:", supabaseKey.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log("\n⏳ Testing basic connection...");

    // Test 1: Try to query the users table (should exist)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (usersError) {
      console.log("❌ Users table query failed:", usersError.message);
    } else {
      console.log("✅ Users table accessible");
    }

    // Test 2: Try to query products table (should exist)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (productsError) {
      console.log("❌ Products table query failed:", productsError.message);
    } else {
      console.log("✅ Products table accessible");
    }

    // Test 3: Try farm visit tables
    const { data: farmVisits, error: farmVisitsError } = await supabase
      .from("farm_visit_availability")
      .select("id")
      .limit(1);

    if (farmVisitsError) {
      if (
        farmVisitsError.code === "PGRST116" ||
        farmVisitsError.message.includes("does not exist")
      ) {
        console.log("⚠️  Farm visit tables don't exist yet (expected)");
      } else {
        console.log("❌ Farm visit query failed:", farmVisitsError.message);
      }
    } else {
      console.log("✅ Farm visit tables accessible");
    }

    console.log("\n🎯 Connection test complete!");
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);

    if (error.message.includes("fetch failed")) {
      console.log("\n🔧 Possible issues:");
      console.log("• Network connectivity problems");
      console.log("• Supabase service temporarily unavailable");
      console.log("• Firewall blocking requests");
      console.log("• Invalid Supabase URL or credentials");
    }
  }
}

testConnection();
