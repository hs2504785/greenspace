import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    // Get all notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*");

    // Get total user count
    const { count: totalUsers, error: userCountError } = await supabase
      .from("users")
      .select("id", { count: "exact" });

    // Get users with push notifications enabled and new_products enabled
    const { data: eligibleUsers, error: eligibleError } = await supabase
      .from("notification_preferences")
      .select(
        `
        user_id,
        new_products,
        push_enabled,
        users!inner(
          id,
          name,
          email
        )
      `
      )
      .eq("new_products", true)
      .eq("push_enabled", true);

    // Check if notification tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "push_subscriptions",
        "notification_preferences",
        "notifications",
      ]);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      database_status: {
        tables_exist: {
          push_subscriptions:
            tablesData?.some((t) => t.table_name === "push_subscriptions") ||
            false,
          notification_preferences:
            tablesData?.some(
              (t) => t.table_name === "notification_preferences"
            ) || false,
          notifications:
            tablesData?.some((t) => t.table_name === "notifications") || false,
        },
        tables_error: tablesError?.message || null,
      },
      user_stats: {
        total_users: totalUsers || 0,
        total_users_error: userCountError?.message || null,
      },
      subscription_stats: {
        total_subscriptions: subscriptions?.length || 0,
        subscriptions_by_user:
          subscriptions?.reduce((acc, sub) => {
            acc[sub.user_id] = (acc[sub.user_id] || 0) + 1;
            return acc;
          }, {}) || {},
        subscriptions_error: subError?.message || null,
      },
      preference_stats: {
        total_preferences: preferences?.length || 0,
        push_enabled_count:
          preferences?.filter((p) => p.push_enabled)?.length || 0,
        new_products_enabled_count:
          preferences?.filter((p) => p.new_products)?.length || 0,
        both_enabled_count:
          preferences?.filter((p) => p.push_enabled && p.new_products)
            ?.length || 0,
        preferences_error: prefError?.message || null,
      },
      eligible_users: {
        count: eligibleUsers?.length || 0,
        users: eligibleUsers || [],
        error: eligibleError?.message || null,
      },
      vapid_config: {
        public_key_configured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        private_key_configured: !!process.env.VAPID_PRIVATE_KEY,
        email_configured: !!process.env.VAPID_EMAIL,
      },
      recommendations: [],
    };

    // Add recommendations based on the data
    if (!debugInfo.database_status.tables_exist.push_subscriptions) {
      debugInfo.recommendations.push(
        "❌ Run the notification system database migration: src/db/migrations/add_notifications_system.sql"
      );
    }

    if (debugInfo.subscription_stats.total_subscriptions === 0) {
      debugInfo.recommendations.push(
        "⚠️ No users have subscribed to push notifications yet. Users need to enable notifications in their settings."
      );
    }

    if (debugInfo.preference_stats.both_enabled_count === 0) {
      debugInfo.recommendations.push(
        "⚠️ No users have both push_enabled and new_products enabled in their preferences."
      );
    }

    if (
      debugInfo.user_stats.total_users > 0 &&
      debugInfo.preference_stats.total_preferences === 0
    ) {
      debugInfo.recommendations.push(
        "⚠️ No notification preferences found. Check if the trigger to create default preferences is working."
      );
    }

    if (
      !debugInfo.vapid_config.public_key_configured ||
      !debugInfo.vapid_config.private_key_configured
    ) {
      debugInfo.recommendations.push(
        "❌ VAPID keys not properly configured in environment variables."
      );
    }

    if (debugInfo.recommendations.length === 0) {
      debugInfo.recommendations.push(
        "✅ Setup looks good! The issue might be that no users have manually subscribed to notifications yet."
      );
    }

    return Response.json(debugInfo, { status: 200 });
  } catch (error) {
    console.error("Debug push subscriptions error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
