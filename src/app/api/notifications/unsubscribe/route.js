import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Create admin client to bypass RLS
    const supabase = createSupabaseClient();

    // Remove push subscription from database
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing push subscription:", error);
      return Response.json(
        {
          error: "Failed to remove subscription",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Push subscription removed for user:", userId);

    return Response.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Unsubscribe API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
