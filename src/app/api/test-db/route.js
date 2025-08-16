import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    console.log("🔧 Testing database connection and user operations...");

    // Test 1: Check current users in database
    const { data: existingUsers, error: listError } = await supabase
      .from("users")
      .select("*")
      .limit(10);

    console.log("📊 Current users in database:", existingUsers?.length || 0);
    if (listError) {
      console.error("❌ Error listing users:", listError);
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
        databaseConnection: !listError,
        userInsertion: !insertError,
        existingUsersCount: existingUsers?.length || 0,
        existingUsers:
          existingUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            provider: u.provider,
          })) || [],
        insertResult,
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
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
