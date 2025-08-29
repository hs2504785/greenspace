import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to verify tree management database setup
export async function GET() {
  try {
    console.log("Testing tree management database setup...");

    // Test 1: Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "trees",
        "farm_layouts",
        "tree_positions",
        "tree_care_logs",
      ]);

    if (tablesError) {
      throw new Error(`Tables check failed: ${tablesError.message}`);
    }

    // Test 2: Check if your user exists
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", "0e13a58b-a5e2-4ed3-9c69-9634c7413550");

    if (usersError) {
      console.log(
        "Users table might not exist or accessible:",
        usersError.message
      );
    }

    // Test 3: Check if farm layouts exist
    const { data: layouts, error: layoutsError } = await supabase
      .from("farm_layouts")
      .select("*")
      .eq("farm_id", "0e13a58b-a5e2-4ed3-9c69-9634c7413550");

    // Test 4: Check if trees table is accessible
    const { data: trees, error: treesError } = await supabase
      .from("trees")
      .select("*")
      .limit(5);

    const result = {
      status: "success",
      timestamp: new Date().toISOString(),
      tests: {
        tables: {
          status: tables ? "✅ Tables accessible" : "❌ Tables not found",
          count: tables?.length || 0,
          found: tables?.map((t) => t.table_name) || [],
          error: tablesError?.message,
        },
        sampleUser: {
          status:
            users && users.length > 0
              ? "✅ Sample user exists"
              : "❌ Sample user not found",
          user: users?.[0] || null,
          error: usersError?.message,
        },
        farmLayouts: {
          status: layoutsError
            ? "❌ Farm layouts table error"
            : "✅ Farm layouts accessible",
          count: layouts?.length || 0,
          layouts: layouts || [],
          error: layoutsError?.message,
        },
        trees: {
          status: treesError
            ? "❌ Trees table error"
            : "✅ Trees table accessible",
          count: trees?.length || 0,
          sampleTrees: trees?.slice(0, 3) || [],
          error: treesError?.message,
        },
      },
      recommendations: [],
    };

    // Add recommendations based on test results
    if (!tables || tables.length < 4) {
      result.recommendations.push(
        "Run the database migration: src/db/migrations/create_tree_management.sql"
      );
    }

    if (!users || users.length === 0) {
      result.recommendations.push(
        "User with ID '0e13a58b-a5e2-4ed3-9c69-9634c7413550' not found. Please check your authentication setup."
      );
    }

    if (layoutsError) {
      result.recommendations.push(
        "Check farm_layouts table permissions and structure"
      );
    }

    if (treesError) {
      result.recommendations.push(
        "Check trees table permissions and structure"
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
        recommendation: "Check Supabase connection and run database migration",
      },
      { status: 500 }
    );
  }
}
