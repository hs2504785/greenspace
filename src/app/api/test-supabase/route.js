import { supabase } from "@/lib/supabase";

export async function GET(request) {
  console.log("🔧 Testing Supabase connection diagnostics...");

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined",
      urlStartsWith: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..."
        : "undefined",
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    client: {
      exists: !!supabase,
      type: typeof supabase,
    },
    tests: {},
  };

  // Test 1: Basic client existence
  if (!supabase) {
    diagnostics.tests.clientExists = false;
    diagnostics.error = "Supabase client is null";
    return Response.json(diagnostics);
  }

  diagnostics.tests.clientExists = true;

  try {
    // Test 2: Simple health check (doesn't require specific tables)
    console.log("🔍 Testing basic Supabase connectivity...");
    const startTime = Date.now();

    // This should work with any Supabase instance
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    const endTime = Date.now();
    diagnostics.tests.basicConnection = {
      success: !error,
      responseTime: endTime - startTime,
      error: error
        ? {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        : null,
    };

    if (error) {
      console.error("❌ Basic connection test failed:", error);
    } else {
      console.log("✅ Basic connection test passed");
    }
  } catch (connectionError) {
    console.error("💥 Connection test threw error:", connectionError);
    diagnostics.tests.basicConnection = {
      success: false,
      error: {
        message: connectionError.message,
        stack: connectionError.stack,
        type: connectionError.constructor.name,
      },
    };
  }

  try {
    // Test 3: Try to access users table specifically
    console.log("🔍 Testing users table access...");
    const startTime = Date.now();

    const { data, error } = await supabase.from("users").select("id").limit(1);

    const endTime = Date.now();
    diagnostics.tests.usersTableAccess = {
      success: !error,
      responseTime: endTime - startTime,
      hasData: !!data && data.length > 0,
      error: error
        ? {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        : null,
    };

    if (error) {
      console.error("❌ Users table access failed:", error);
    } else {
      console.log("✅ Users table access passed");
    }
  } catch (tableError) {
    console.error("💥 Users table test threw error:", tableError);
    diagnostics.tests.usersTableAccess = {
      success: false,
      error: {
        message: tableError.message,
        stack: tableError.stack,
        type: tableError.constructor.name,
      },
    };
  }

  return Response.json(diagnostics);
}
