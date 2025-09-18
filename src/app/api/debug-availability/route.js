import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Debug version of farm visit availability API
 * Simplified to identify what's causing the 500 error
 */
export async function GET(request) {
  try {
    console.log("🔍 Debug: Starting availability API...");

    const supabase = createSupabaseClient();
    console.log("🔍 Debug: Supabase client created");

    // Step 1: Test basic query
    console.log("🔍 Debug: Testing basic availability query...");
    const { data: basicData, error: basicError } = await supabase
      .from("farm_visit_availability")
      .select("id, seller_id, date")
      .limit(5);

    if (basicError) {
      console.log("🔍 Debug: Basic availability error:", basicError);
      return NextResponse.json(
        {
          error: "Basic availability query failed",
          details: basicError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      "🔍 Debug: Basic availability query success, found:",
      basicData?.length || 0
    );

    // Step 2: Test with joins
    console.log("🔍 Debug: Testing availability with seller join...");
    const { data: joinData, error: joinError } = await supabase
      .from("farm_visit_availability")
      .select(
        `
        *,
        seller:users!farm_visit_availability_seller_id_fkey(id, name, phone)
      `
      )
      .limit(3);

    if (joinError) {
      console.log("🔍 Debug: Join query error:", joinError);
      return NextResponse.json(
        {
          error: "Availability join query failed",
          details: joinError.message,
          code: joinError.code,
        },
        { status: 500 }
      );
    }

    console.log("🔍 Debug: Join query success");

    // Step 3: Test date filtering
    console.log("🔍 Debug: Testing date filtering...");
    const today = new Date().toISOString().split("T")[0];
    const { data: filteredData, error: filteredError } = await supabase
      .from("farm_visit_availability")
      .select("*")
      .gte("date", today)
      .limit(3);

    if (filteredError) {
      console.log("🔍 Debug: Date filtering error:", filteredError);
    }

    return NextResponse.json({
      message: "Debug availability API completed successfully",
      results: {
        basicQuery: basicData?.length || 0,
        joinQuery: joinData?.length || 0,
        filteredQuery: filteredData?.length || 0,
      },
      sampleData: basicData?.[0] || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🔍 Debug: Unexpected availability error:", error);
    return NextResponse.json(
      {
        error: "Unexpected error in debug availability API",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
