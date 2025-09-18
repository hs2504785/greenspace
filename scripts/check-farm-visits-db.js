#!/usr/bin/env node

/**
 * Farm Visits Database Checker
 *
 * This script checks if the farm visit tables exist and provides setup instructions
 * Run: node scripts/check-farm-visits-db.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("🔍 Checking Farm Visit System Database Status...\n");

  const tablesToCheck = [
    "farm_visit_availability",
    "farm_visit_requests",
    "farm_visit_reviews",
    "seller_farm_profiles",
  ];

  const results = {};

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message.includes("does not exist")
        ) {
          results[table] = { exists: false, error: "Table does not exist" };
        } else {
          results[table] = { exists: false, error: error.message };
        }
      } else {
        results[table] = { exists: true, count: data?.length || 0 };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }

  // Display results
  console.log("📊 Database Status Report:");
  console.log("=".repeat(50));

  let allTablesExist = true;

  for (const [table, result] of Object.entries(results)) {
    const status = result.exists ? "✅" : "❌";
    const details = result.exists
      ? `(${result.count} records)`
      : `- ${result.error}`;

    console.log(`${status} ${table.padEnd(25)} ${details}`);

    if (!result.exists) {
      allTablesExist = false;
    }
  }

  console.log("\n" + "=".repeat(50));

  if (allTablesExist) {
    console.log("🎉 All farm visit tables exist! System is ready to use.");

    // Check for any data
    try {
      const { data: availability } = await supabase
        .from("farm_visit_availability")
        .select("count(*)")
        .single();

      const { data: requests } = await supabase
        .from("farm_visit_requests")
        .select("count(*)")
        .single();

      console.log("\n📈 Data Summary:");
      console.log(`   • Availability Slots: ${availability?.count || 0}`);
      console.log(`   • Visit Requests: ${requests?.count || 0}`);
    } catch (err) {
      console.log("\n⚠️  Tables exist but unable to query data counts");
    }
  } else {
    console.log("❌ Farm visit system tables are missing!");
    console.log("\n🛠️  Setup Instructions:");
    console.log("1. Open Supabase SQL Editor");
    console.log("2. Run the farm visit migration script:");
    console.log("   📁 database/create_farm_visit_system.sql");
    console.log(
      "\n💡 This will create all necessary tables and enable farm visits."
    );
  }

  console.log("\n🌐 Supabase Project:", supabaseUrl);
}

async function main() {
  try {
    await checkTables();
  } catch (error) {
    console.error("❌ Error checking database:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("• Check your .env file has correct Supabase credentials");
    console.log("• Verify your Supabase project is running");
    console.log("• Ensure your API key has the required permissions");
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkTables };
