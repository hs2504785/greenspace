import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  console.log("🔧 Testing basic Supabase without custom fetch...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("📋 Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseKey?.length,
    urlPrefix: supabaseUrl?.substring(0, 40),
    keyPrefix: supabaseKey?.substring(0, 20),
  });

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({
      success: false,
      error: "Missing environment variables",
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      },
    });
  }

  try {
    // Create a fresh Supabase client with minimal configuration
    console.log("🔄 Creating basic Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("✅ Supabase client created, testing connection...");

    // Test 1: Simple select query
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name")
      .limit(5);

    console.log("📊 Users query result:", {
      success: !usersError,
      userCount: users?.length,
      error: usersError?.message,
    });

    // Test 2: Try to insert a test user
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      role: "buyer",
      provider: "google",
    };

    console.log("👤 Testing user insertion...");
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([testUser])
      .select()
      .single();

    let insertSuccess = false;
    if (!insertError && newUser) {
      insertSuccess = true;
      console.log("✅ User created successfully:", newUser.id);

      // Clean up - delete test user
      await supabase.from("users").delete().eq("id", newUser.id);
      console.log("🧹 Test user cleaned up");
    } else {
      console.error("❌ User insertion failed:", insertError);
    }

    return Response.json({
      success: true,
      tests: {
        connection: !usersError,
        userQuery: {
          success: !usersError,
          count: users?.length || 0,
          users:
            users?.map((u) => ({ id: u.id, email: u.email, name: u.name })) ||
            [],
          error: usersError
            ? {
                message: usersError.message,
                hint: usersError.hint,
                code: usersError.code,
                details: usersError.details,
              }
            : null,
        },
        userInsertion: {
          success: insertSuccess,
          error: insertError
            ? {
                message: insertError.message,
                hint: insertError.hint,
                code: insertError.code,
                details: insertError.details,
              }
            : null,
        },
      },
      environment: {
        supabaseUrl,
        keyLength: supabaseKey.length,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
