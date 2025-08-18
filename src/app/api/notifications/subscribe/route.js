import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return Response.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userAgent = req.headers.get("user-agent") || "";

    // Create admin client to bypass RLS
    const supabase = createSupabaseClient();

    // Store push subscription in database
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,endpoint",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving push subscription:", error);
      return Response.json(
        {
          error: "Failed to save subscription",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Push subscription saved for user:", userId);

    return Response.json({
      success: true,
      subscription: data,
      message: "Successfully subscribed to push notifications",
    });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
