#!/usr/bin/env node

/**
 * Tree Table Migration Script
 *
 * This script applies the database migration to update tree fields
 * from instance-based to type-based structure.
 *
 * Usage: node scripts/run-tree-migration.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runMigration() {
  try {
    log("cyan", "🚀 Starting Tree Table Migration...\n");

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log("red", "❌ Error: Missing Supabase environment variables");
      log("yellow", "   Required: NEXT_PUBLIC_SUPABASE_URL");
      log(
        "yellow",
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
      db: {
        schema: "public",
      },
    });

    log("green", "✅ Connected to Supabase database");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "../src/db/migrations/update_tree_fields_to_type_based.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      log("red", `❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    log("blue", "📄 Migration file loaded successfully");

    // Check current table structure before migration
    log("yellow", "🔍 Checking current table structure...");
    const { data: columnsBefore, error: columnsError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'trees' 
              ORDER BY ordinal_position;`,
      }
    );

    if (columnsError) {
      log(
        "yellow",
        "⚠️  Could not check table structure (might not exist yet)"
      );
    } else {
      log("blue", "📋 Current table structure:");
      console.table(columnsBefore);
    }

    // Execute migration
    log("magenta", "⚡ Executing migration...");

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });
        if (error) {
          log("red", `❌ Error executing statement: ${error.message}`);
          log("yellow", `Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    log("green", "✅ Migration executed successfully!");

    // Verify migration results
    log("yellow", "🔍 Verifying migration results...");

    const { data: columnsAfter, error: verifyError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'trees' 
              ORDER BY ordinal_position;`,
      }
    );

    if (verifyError) {
      log("red", `❌ Error verifying migration: ${verifyError.message}`);
    } else {
      log("green", "📋 Updated table structure:");
      console.table(columnsAfter);
    }

    // Check sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from("trees")
      .select("code, name, category, season, years_to_fruit, mature_height")
      .limit(5);

    if (sampleError) {
      log("yellow", `⚠️  Could not fetch sample data: ${sampleError.message}`);
    } else if (sampleData && sampleData.length > 0) {
      log("green", "🌳 Sample tree data with new fields:");
      console.table(sampleData);
    } else {
      log("blue", "ℹ️  No existing tree data found");
    }

    log("green", "\n🎉 Migration completed successfully!");
    log("cyan", "📋 Next steps:");
    log("white", "   1. Test the tree management interface at /trees");
    log("white", "   2. Try creating and editing trees");
    log("white", "   3. Test planting trees in the farm layout");
  } catch (error) {
    log("red", `\n💥 Migration failed: ${error.message}`);
    log("yellow", "\n🔙 If you need to rollback, run:");
    log("white", "   node scripts/rollback-tree-migration.js");
    process.exit(1);
  }
}

// Run the migration
runMigration();

