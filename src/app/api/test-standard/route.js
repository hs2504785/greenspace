import { supabase } from "@/lib/supabase";

export async function GET(request) {
  console.log("🔧 Testing standard Supabase configuration...");

  const results = {
    timestamp: new Date().toISOString(),
    clientExists: !!supabase,
    tests: {},
  };

  if (!supabase) {
    console.error("❌ Supabase client is null");
    return Response.json({
      success: false,
      error: "Supabase client not initialized",
      results,
    });
  }

  try {
    // Test 1: Simple query
    console.log("📋 Test 1: Simple users query...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, role, provider")
      .limit(10);

    results.tests.usersQuery = {
      success: !usersError,
      count: users?.length || 0,
      data: users || [],
      error: usersError
        ? {
            message: usersError.message,
            hint: usersError.hint,
            code: usersError.code,
            details: usersError.details,
          }
        : null,
    };

    console.log(
      `📊 Users query result: ${!usersError ? "SUCCESS" : "FAILED"}, count: ${
        users?.length || 0
      }`
    );

    // Test 2: Test insertion
    console.log("👤 Test 2: Test user insertion...");
    const testUser = {
      email: `test-standard-${Date.now()}@example.com`,
      name: "Standard Test User",
      role: "buyer",
      provider: "google",
    };

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([testUser])
      .select()
      .single();

    let insertSuccess = false;
    if (!insertError && newUser) {
      insertSuccess = true;
      console.log("✅ Test user created successfully:", newUser.id);

      // Clean up
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", newUser.id);

      if (!deleteError) {
        console.log("🧹 Test user cleaned up");
      }
    }

    results.tests.userInsertion = {
      success: insertSuccess,
      error: insertError
        ? {
            message: insertError.message,
            hint: insertError.hint,
            code: insertError.code,
            details: insertError.details,
          }
        : null,
    };

    console.log(
      `👤 Insertion test result: ${insertSuccess ? "SUCCESS" : "FAILED"}`
    );

    // Test 3: Check table info
    console.log("🗂️ Test 3: Table structure check...");
    const { data: tableData, error: tableError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    results.tests.tableStructure = {
      success: !tableError,
      hasData: !!tableData && tableData.length > 0,
      sampleRecord: tableData?.[0] || null,
      error: tableError
        ? {
            message: tableError.message,
            hint: tableError.hint,
            code: tableError.code,
          }
        : null,
    };

    const overallSuccess =
      results.tests.usersQuery.success &&
      results.tests.userInsertion.success &&
      results.tests.tableStructure.success;

    console.log(
      `🎯 Overall test result: ${
        overallSuccess ? "ALL TESTS PASSED" : "SOME TESTS FAILED"
      }`
    );

    return Response.json({
      success: overallSuccess,
      message: overallSuccess
        ? "All Supabase operations working!"
        : "Some operations failed",
      results,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return Response.json(
      {
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name,
        },
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
