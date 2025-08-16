import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    console.log("🔧 Testing database connection and user operations...");

    // Test 0: Check if Supabase client exists
    if (!supabase) {
      return Response.json({
        success: false,
        error:
          "Supabase client is null - check environment variables and initialization",
        tests: {
          databaseConnection: false,
          userInsertion: false,
          existingUsersCount: 0,
          existingUsers: [],
          insertResult: "Supabase client not initialized",
          supabaseClientExists: false,
          environment: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
              : "not set",
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    console.log("✅ Supabase client exists, testing connection...");

    // Test 1: Check current users in database
    console.log("🔍 Attempting to query users table...");
    const { data: existingUsers, error: listError } = await supabase
      .from("users")
      .select("*")
      .limit(10);

    console.log("📊 Users query result:", {
      usersCount: existingUsers?.length || 0,
      hasError: !!listError,
      errorMessage: listError?.message,
      errorCode: listError?.code,
    });

    if (listError) {
      console.error("❌ Error listing users:", {
        message: listError.message,
        code: listError.code,
        details: listError.details,
        hint: listError.hint,
      });
    }

    // Test 2: Test inserting a user (simulate Google auth)
    const testUser = {
      email: "test-" + Date.now() + "@example.com",
      name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
      provider: "google",
      role: "buyer",
    };

    console.log("👤 Testing user creation with:", testUser);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([testUser])
      .select()
      .single();

    let insertResult = "success";
    if (insertError) {
      console.error("❌ Insert error:", insertError);
      insertResult = insertError.message;
    } else {
      console.log("✅ User created:", newUser);

      // Clean up test user
      await supabase.from("users").delete().eq("id", newUser.id);
    }

    // Test 3: Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    return Response.json({
      success: true,
      tests: {
        supabaseClientExists: !!supabase,
        databaseConnection: !listError,
        userInsertion: !insertError,
        existingUsersCount: existingUsers?.length || 0,
        existingUsers:
          existingUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            provider: u.provider,
            created_at: u.created_at,
          })) || [],
        insertResult,
        errorDetails: {
          listError: listError
            ? {
                message: listError.message,
                code: listError.code,
                details: listError.details,
                hint: listError.hint,
              }
            : null,
          insertError: insertError
            ? {
                message: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
              }
            : null,
        },
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 50)}...`
            : "not set",
          nodeEnv: process.env.NODE_ENV,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Test error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
