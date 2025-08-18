import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Create admin client to bypass RLS
    const supabase = createSupabaseClient();

    // Get user's notification preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found error is ok
      console.error("Error fetching notification preferences:", error);
      return Response.json(
        {
          error: "Failed to fetch preferences",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      new_products: true,
      order_updates: true,
      price_drops: false,
      seller_messages: true,
      marketing: false,
      push_enabled: true,
      email_enabled: true,
    };

    return Response.json({
      preferences: data || defaultPreferences,
    });
  } catch (error) {
    console.error("Preferences GET API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await req.json();
    const userId = session.user.id;

    // Validate preferences object
    const allowedFields = [
      "new_products",
      "order_updates",
      "price_drops",
      "seller_messages",
      "marketing",
      "push_enabled",
      "email_enabled",
    ];

    const sanitizedPreferences = {};
    for (const field of allowedFields) {
      if (field in preferences) {
        sanitizedPreferences[field] = Boolean(preferences[field]);
      }
    }

    if (Object.keys(sanitizedPreferences).length === 0) {
      return Response.json(
        { error: "No valid preferences provided" },
        { status: 400 }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createSupabaseClient();

    // Update or insert notification preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          ...sanitizedPreferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving notification preferences:", error);
      return Response.json(
        {
          error: "Failed to save preferences",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Notification preferences updated for user:", userId);

    return Response.json({
      success: true,
      preferences: data,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Preferences POST API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
