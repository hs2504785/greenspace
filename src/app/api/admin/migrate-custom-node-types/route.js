import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request) {
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase configuration is missing",
          details:
            "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting custom node types migration...");

    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      "src/db/migrations/add_custom_node_types.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Migration file not found",
          details: `Expected file at: ${migrationPath}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log("Migration file loaded successfully");

    // Check if table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from("custom_node_types")
      .select("id")
      .limit(1);

    // If no error, table already exists - but we still need to run the migration
    // to ensure the constraint includes 'default' type
    if (!tableCheckError) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Custom node types table exists but may need constraint update",
          instructions: `The table exists but may not support 'default' node type yet.
Go to your Supabase dashboard > SQL Editor and run this SQL to ensure it's up to date:

${migrationSQL}

This migration is safe to run multiple times and will update the constraint to include 'default' type.`,
          sql: migrationSQL,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Table doesn't exist, provide manual migration instructions
    console.log(
      "Custom node types table does not exist, providing manual migration instructions"
    );

    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Please create the custom node types table manually through Supabase SQL Editor",
        instructions: `Go to your Supabase dashboard > SQL Editor and run this SQL:

${migrationSQL}

After running this SQL, custom node types will be persisted to the database and survive page refreshes.`,
        sql: migrationSQL,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error during migration:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unexpected error during migration",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
