import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

/**
 * Debug version of farm visit requests API
 * Simplified to identify what's causing the 500 error
 */
export async function GET(request) {
  try {
    console.log("🔍 Debug: Starting requests API...");

    // Step 1: Test session
    const session = await getServerSession(authOptions);
    console.log(
      "🔍 Debug: Session check:",
      session ? "authenticated" : "not authenticated"
    );

    if (!session) {
      console.log("🔍 Debug: No session, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Test Supabase client
    const supabase = createSupabaseClient();
    console.log("🔍 Debug: Supabase client created");

    // Step 3: Test basic query
    console.log("🔍 Debug: Attempting basic query...");
    const { data: basicTest, error: basicError } = await supabase
      .from("farm_visit_requests")
      .select("id")
      .limit(1);

    if (basicError) {
      console.log("🔍 Debug: Basic query error:", basicError);
      return NextResponse.json(
        {
          error: "Database query failed",
          details: basicError.message,
        },
        { status: 500 }
      );
    }

    console.log("🔍 Debug: Basic query success");

    // Step 4: Test complex query with joins
    console.log("🔍 Debug: Attempting complex query...");
    const { data: complexData, error: complexError } = await supabase
      .from("farm_visit_requests")
      .select(
        `
        *,
        user:users!farm_visit_requests_user_id_fkey(id, name, email, phone),
        seller:users!farm_visit_requests_seller_id_fkey(id, name, email, phone),
        availability:farm_visit_availability(*)
      `
      )
      .limit(5);

    if (complexError) {
      console.log("🔍 Debug: Complex query error:", complexError);
      return NextResponse.json(
        {
          error: "Complex query failed",
          details: complexError.message,
          code: complexError.code,
        },
        { status: 500 }
      );
    }

    console.log("🔍 Debug: Complex query success");

    return NextResponse.json({
      message: "Debug requests API completed successfully",
      sessionInfo: {
        userId: session.user.id,
        role: session.user.role,
      },
      queryResults: {
        basicTest: basicTest?.length || 0,
        complexData: complexData?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🔍 Debug: Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Unexpected error in debug API",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
