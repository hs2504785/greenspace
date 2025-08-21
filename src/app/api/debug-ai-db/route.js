import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    console.log("🔍 AI Database Debug Test");
    
    // Test basic connection
    const { data: tables, error: connectionError } = await supabase
      .from("vegetables")
      .select("count", { count: "exact", head: true });

    if (connectionError) {
      console.error("❌ Connection error:", connectionError);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: connectionError.message,
      });
    }

    // Get sample products
    const { data: products, error: productsError } = await supabase
      .from("vegetables")
      .select("id, name, price, created_at")
      .limit(5)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("❌ Products query error:", productsError);
      return NextResponse.json({
        success: false,
        error: "Products query failed",
        details: productsError.message,
      });
    }

    // Test search functionality
    const { data: searchResults, error: searchError } = await supabase
      .from("vegetables")
      .select("id, name, price")
      .or("name.ilike.%Sweet dragon pack%, description.ilike.%Sweet dragon pack%, category.ilike.%Sweet dragon pack%")
      .limit(3);

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) + "...",
      },
      database: {
        connected: true,
        totalProducts: tables?.count || 0,
        sampleProducts: products || [],
        searchTest: {
          query: "Sweet dragon pack",
          results: searchResults || [],
          found: (searchResults || []).length > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("💥 Debug test failed:", error);
    return NextResponse.json({
      success: false,
      error: "Debug test failed",
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
