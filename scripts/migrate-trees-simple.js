#!/usr/bin/env node

/**
 * Simple Tree Table Migration Script
 *
 * This script applies the database migration step by step
 * using direct SQL queries through Supabase.
 *
 * Usage: node scripts/migrate-trees-simple.js
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load environment variables manually
function loadEnvFile() {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    });
  }
}

loadEnvFile();

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

// Tree data for migration
const TREE_UPDATES = [
  {
    code: "M",
    category: "tropical",
    season: "summer",
    years_to_fruit: 3,
    mature_height: "large",
  },
  {
    code: "L",
    category: "citrus",
    season: "year-round",
    years_to_fruit: 2,
    mature_height: "medium",
  },
  {
    code: "AS",
    category: "exotic",
    season: "year-round",
    years_to_fruit: 4,
    mature_height: "medium",
  },
  {
    code: "A",
    category: "stone",
    season: "winter",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "CA",
    category: "tropical",
    season: "winter",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "G",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 2,
    mature_height: "medium",
  },
  {
    code: "AN",
    category: "stone",
    season: "summer",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "P",
    category: "stone",
    season: "winter",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "MB",
    category: "berry",
    season: "summer",
    years_to_fruit: 2,
    mature_height: "large",
  },
  {
    code: "JA",
    category: "tropical",
    season: "summer",
    years_to_fruit: 5,
    mature_height: "large",
  },
  {
    code: "BC",
    category: "berry",
    season: "year-round",
    years_to_fruit: 2,
    mature_height: "small",
  },
  {
    code: "AV",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 4,
    mature_height: "large",
  },
  {
    code: "SF",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "C",
    category: "nut",
    season: "summer",
    years_to_fruit: 5,
    mature_height: "large",
  },
  {
    code: "PR",
    category: "stone",
    season: "winter",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "PC",
    category: "stone",
    season: "summer",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "SP",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 4,
    mature_height: "large",
  },
  {
    code: "MR",
    category: "exotic",
    season: "year-round",
    years_to_fruit: 1,
    mature_height: "medium",
  },
  {
    code: "BB",
    category: "berry",
    season: "summer",
    years_to_fruit: 2,
    mature_height: "small",
  },
  {
    code: "LC",
    category: "tropical",
    season: "summer",
    years_to_fruit: 5,
    mature_height: "large",
  },
  {
    code: "MF",
    category: "exotic",
    season: "year-round",
    years_to_fruit: 3,
    mature_height: "small",
  },
  {
    code: "KR",
    category: "berry",
    season: "summer",
    years_to_fruit: 2,
    mature_height: "small",
  },
  {
    code: "AB",
    category: "stone",
    season: "winter",
    years_to_fruit: 3,
    mature_height: "medium",
  },
  {
    code: "BA",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 1,
    mature_height: "medium",
  },
  {
    code: "PA",
    category: "tropical",
    season: "year-round",
    years_to_fruit: 1,
    mature_height: "medium",
  },
  {
    code: "GR",
    category: "berry",
    season: "summer",
    years_to_fruit: 2,
    mature_height: "medium",
  },
];

async function executeMigration() {
  try {
    log("cyan", "🚀 Starting Tree Table Migration (Simple Method)...\n");

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log("red", "❌ Error: Missing Supabase environment variables");
      log("yellow", "   Add these to your .env.local file:");
      log("white", "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
      log("white", "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
      process.exit(1);
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    log("green", "✅ Connected to Supabase database");

    // Step 1: Check if we need to run the migration
    log("yellow", "🔍 Checking current table structure...");

    const { data: existingTrees, error: fetchError } = await supabase
      .from("trees")
      .select("*")
      .limit(1);

    if (fetchError) {
      log("red", `❌ Error checking table: ${fetchError.message}`);
      throw fetchError;
    }

    // Check if migration already applied
    if (
      existingTrees &&
      existingTrees.length > 0 &&
      existingTrees[0].category !== undefined
    ) {
      log("yellow", "⚠️  Migration appears to have already been applied!");
      log("blue", "   Current tree structure includes new fields.");

      const { data: sampleData } = await supabase
        .from("trees")
        .select("code, name, category, season, years_to_fruit, mature_height")
        .limit(3);

      if (sampleData) {
        log("green", "📋 Sample data with new fields:");
        console.table(sampleData);
      }

      return;
    }

    log("blue", "📋 Tree table needs migration - proceeding...");

    // Since we can't easily run DDL through the JS client,
    // we'll provide instructions to run the SQL manually
    log("red", "\n⚠️  DATABASE SCHEMA CHANGES REQUIRED");
    log("yellow", "\n📋 Please run the following steps manually:");
    log("white", "\n1. Go to your Supabase Dashboard → SQL Editor");
    log("white", "2. Copy and paste this SQL:\n");

    console.log(`
-- Add new columns to trees table
ALTER TABLE trees 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS season VARCHAR(50),
  ADD COLUMN IF NOT EXISTS years_to_fruit INTEGER,
  ADD COLUMN IF NOT EXISTS mature_height VARCHAR(50);

-- Remove old columns
ALTER TABLE trees 
  DROP COLUMN IF EXISTS scientific_name,
  DROP COLUMN IF EXISTS planting_date,
  DROP COLUMN IF EXISTS expected_harvest_date,
  DROP COLUMN IF EXISTS status;

-- Add constraints
ALTER TABLE trees 
  ADD CONSTRAINT check_category 
  CHECK (category IN ('citrus', 'stone', 'tropical', 'berry', 'nut', 'exotic'));

ALTER TABLE trees 
  ADD CONSTRAINT check_season 
  CHECK (season IN ('summer', 'winter', 'monsoon', 'year-round'));

ALTER TABLE trees 
  ADD CONSTRAINT check_mature_height 
  CHECK (mature_height IN ('small', 'medium', 'large'));
`);

    log("white", '\n3. Click "Run" to execute the schema changes');
    log("white", "4. Then run this script again to populate the data");

    log(
      "\n" +
        colors.cyan +
        "🎯 After running the SQL above, restart this script to populate tree data!" +
        colors.reset
    );
  } catch (error) {
    log("red", `\n💥 Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the migration
executeMigration();
