import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function GET(req) {
  try {
    console.log("🔍 DEBUG: Starting notification debug endpoint");

    // Check session
    const session = await getServerSession(authOptions);
    console.log("🔍 DEBUG: Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    });

    if (!session) {
      return Response.json(
        {
          error: "No session found",
          debug: "User is not authenticated",
        },
        { status: 401 }
      );
    }

    if (!session.user?.id) {
      return Response.json(
        {
          error: "No user ID in session",
          debug: "Session exists but user.id is missing",
          sessionUser: session.user,
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log("🔍 DEBUG: Using userId:", userId);

    // Test Supabase connection
    const supabase = createSupabaseClient();
    console.log("🔍 DEBUG: Supabase client created");

    // Test if notification_preferences table exists and is accessible
    try {
      const { data: tableTest, error: tableError } = await supabase
        .from("notification_preferences")
        .select("count")
        .limit(1);

      console.log("🔍 DEBUG: Table access test:", {
        success: !tableError,
        error: tableError?.message,
        data: tableTest,
      });

      if (tableError) {
        return Response.json(
          {
            error: "Database table access failed",
            debug: "notification_preferences table is not accessible",
            details: tableError.message,
            code: tableError.code,
          },
          { status: 500 }
        );
      }
    } catch (tableTestError) {
      console.error("🔍 DEBUG: Table test failed:", tableTestError);
      return Response.json(
        {
          error: "Database connection failed",
          debug: "Cannot access notification_preferences table",
          details: tableTestError.message,
        },
        { status: 500 }
      );
    }

    // Try to get user's notification preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    console.log("🔍 DEBUG: Preferences query result:", {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      dataKeys: data ? Object.keys(data) : null,
    });

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    console.log("🔍 DEBUG: User lookup result:", {
      userExists: !!userData,
      userError: userError?.message,
      userData: userData,
    });

    // Check for push subscriptions
    const { data: pushSubs, error: pushError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    console.log("🔍 DEBUG: Push subscriptions result:", {
      hasSubscriptions: !!pushSubs && pushSubs.length > 0,
      subscriptionCount: pushSubs?.length || 0,
      pushError: pushError?.message,
      subscriptions:
        pushSubs?.map((s) => ({
          id: s.id,
          endpoint: s.endpoint?.substring(0, 50) + "...",
          created: s.created_at,
          updated: s.updated_at,
        })) || [],
    });

    return Response.json({
      success: true,
      debug: {
        session: {
          authenticated: true,
          userId: userId,
          userEmail: session.user.email,
          userName: session.user.name,
        },
        database: {
          tableAccessible: true,
          userExists: !!userData,
          preferencesExist: !!data,
          preferencesError: error?.message || null,
          preferencesData: data || null,
          pushSubscriptions: {
            hasActiveSubscriptions: !!pushSubs && pushSubs.length > 0,
            subscriptionCount: pushSubs?.length || 0,
            subscriptions:
              pushSubs?.map((s) => ({
                id: s.id,
                endpoint: s.endpoint?.substring(0, 50) + "...",
                created: s.created_at,
                updated: s.updated_at,
              })) || [],
          },
        },
        recommendation: !data
          ? "User preferences don't exist - this is normal for new users"
          : !pushSubs || pushSubs.length === 0
          ? "❌ No push subscriptions found - user needs to enable push notifications"
          : "✅ User preferences and push subscriptions found successfully",
      },
    });
  } catch (err) {
    console.error("🔍 DEBUG: Unexpected error:", err);
    return Response.json(
      {
        error: "Unexpected error during debug",
        debug: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
