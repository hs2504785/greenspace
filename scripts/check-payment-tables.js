#!/usr/bin/env node

/**
 * Check if payment system tables exist in the database
 * This helps diagnose payment verification issues
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function checkPaymentTables() {
  console.log("🔍 Checking payment system tables...\n");

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Error: Missing Supabase environment variables");
    console.error("   Required: NEXT_PUBLIC_SUPABASE_URL");
    console.error(
      "   Required: SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("✅ Connected to Supabase database\n");

  // Check if payment_transactions table exists
  try {
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["payment_transactions", "payment_methods"]);

    if (error) {
      console.error("❌ Error checking tables:", error.message);
      process.exit(1);
    }

    const tableNames = tables.map((t) => t.table_name);

    console.log("📋 Payment System Tables Status:");
    console.log("================================");

    const requiredTables = ["payment_transactions", "payment_methods"];
    let allTablesExist = true;

    requiredTables.forEach((tableName) => {
      if (tableNames.includes(tableName)) {
        console.log(`✅ ${tableName} - EXISTS`);
      } else {
        console.log(`❌ ${tableName} - MISSING`);
        allTablesExist = false;
      }
    });

    console.log("\n");

    if (allTablesExist) {
      console.log("🎉 All payment system tables exist!");

      // Check if there are any payment transactions
      const { data: transactions, error: transError } = await supabase
        .from("payment_transactions")
        .select("id, status")
        .limit(5);

      if (transError) {
        console.log(
          "⚠️  Could not query payment_transactions:",
          transError.message
        );
      } else {
        console.log(
          `📊 Found ${transactions.length} payment transactions in database`
        );
      }
    } else {
      console.log("🚨 Payment system tables are missing!");
      console.log(
        "\n📝 To fix this, run the following migration in Supabase SQL Editor:"
      );
      console.log("   File: database/add_payment_system.sql");
      console.log("\n🔗 Steps:");
      console.log("   1. Go to your Supabase dashboard");
      console.log("   2. Open SQL Editor");
      console.log(
        "   3. Copy and paste the contents of database/add_payment_system.sql"
      );
      console.log("   4. Click Run to execute the migration");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

// Run the check
checkPaymentTables().catch(console.error);
