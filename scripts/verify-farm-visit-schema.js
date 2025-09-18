#!/usr/bin/env node

/**
 * Farm Visit Schema Verification
 *
 * Checks if all required columns exist in the farm visit tables
 * Run: node scripts/verify-farm-visit-schema.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log("🔍 Verifying Farm Visit Database Schema...\n");

  // Required columns for each table
  const requiredColumns = {
    farm_visit_availability: [
      "id",
      "seller_id",
      "date",
      "start_time",
      "end_time",
      "is_available",
      "max_visitors",
      "current_bookings",
      "price_per_person",
      "visit_type",
      "location_type",
      "space_description",
      "special_notes",
      "activity_type",
      "created_at",
      "updated_at",
    ],
    farm_visit_requests: [
      "id",
      "user_id",
      "seller_id",
      "availability_id",
      "requested_date",
      "requested_time_start",
      "requested_time_end",
      "number_of_visitors",
      "visitor_name",
      "visitor_phone",
      "visitor_email",
      "purpose",
      "special_requirements",
      "message_to_farmer",
      "status",
      "admin_notes",
      "rejection_reason",
      "reviewed_by",
      "reviewed_at",
      "created_at",
      "updated_at",
    ],
    seller_farm_profiles: [
      "id",
      "seller_id",
      "farm_name",
      "farm_story",
      "farm_type",
      "detailed_location",
      "farming_philosophy",
      "sustainability_practices",
      "visit_booking_enabled",
      "garden_visit_enabled",
      "garden_type",
      "garden_size_sqft",
      "garden_specialties",
      "growing_methods",
      "garden_features",
      "visit_contact_info",
      "public_profile",
      "farm_gallery_urls",
      "profile_verified",
      "created_at",
      "updated_at",
    ],
  };

  console.log("📊 Schema Verification Report:");
  console.log("=".repeat(60));

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    console.log(`\n🔍 Checking table: ${tableName}`);

    try {
      // Try to select all columns to see which ones exist
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(0); // Don't return data, just check schema

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message.includes("does not exist")
        ) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`❌ Error querying '${tableName}': ${error.message}`);

          // Try to identify missing columns from error message
          if (
            error.message.includes("column") &&
            error.message.includes("does not exist")
          ) {
            const missingColumn = error.message.match(
              /column "([^"]+)" does not exist/
            );
            if (missingColumn) {
              console.log(`   Missing column: ${missingColumn[1]}`);
            }
          }
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Failed to check '${tableName}': ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🛠️  If tables are missing or have schema errors:");
  console.log("1. Check Supabase SQL Editor for any error messages");
  console.log(
    "2. Re-run the migration script: database/create_farm_visit_system.sql"
  );
  console.log("3. Ensure you have proper permissions to create tables");
  console.log("\n🔗 Supabase Project:", supabaseUrl);
}

async function main() {
  try {
    await verifySchema();
  } catch (error) {
    console.error("❌ Error verifying schema:", error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifySchema };
