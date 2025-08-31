#!/usr/bin/env node

/**
 * Tree Table Migration Rollback Script
 *
 * This script rolls back the tree table migration
 * from type-based back to instance-based structure.
 *
 * Usage: node scripts/rollback-tree-migration.js
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

async function rollbackMigration() {
  try {
    log("cyan", "🔄 Starting Tree Table Migration Rollback...\n");

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    log("green", "✅ Connected to Supabase database");

    // Read rollback file
    const rollbackPath = path.join(
      __dirname,
      "../src/db/migrations/rollback_tree_fields_update.sql"
    );

    if (!fs.existsSync(rollbackPath)) {
      log("red", `❌ Rollback file not found: ${rollbackPath}`);
      process.exit(1);
    }

    const rollbackSQL = fs.readFileSync(rollbackPath, "utf8");
    log("blue", "📄 Rollback file loaded successfully");

    // Execute rollback
    log("magenta", "⚡ Executing rollback...");

    // Execute the rollback SQL
    const { error } = await supabase.rpc("exec_sql", { sql: rollbackSQL });

    if (error) {
      log("red", `❌ Error executing rollback: ${error.message}`);
      throw error;
    }

    log("green", "✅ Rollback executed successfully!");
    log("green", "🎉 Tree table restored to original structure");
  } catch (error) {
    log("red", `\n💥 Rollback failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the rollback
rollbackMigration();

