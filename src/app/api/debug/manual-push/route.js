import webpush from "web-push";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

// Configure web-push with VAPID keys
const vapidEmail =
  process.env.VAPID_EMAIL || "mailto:admin@aryanaturalarms.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    const userId = targetUserId || session.user.id;

    console.log("🔧 Manual push test for user:", userId);

    // Check VAPID configuration
    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json(
        {
          error: "VAPID keys not configured",
          debug: {
            vapidPublicKey: !!vapidPublicKey,
            vapidPrivateKey: !!vapidPrivateKey,
          },
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient();

    // Get user's push subscription
    const { data: subscription, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !subscription) {
      return Response.json(
        {
          error: "No push subscription found",
          debug: {
            userId,
            error: error?.message,
            hasSubscription: !!subscription,
          },
        },
        { status: 404 }
      );
    }

    // Prepare test notification
    const testPayload = {
      title: "🧪 Manual Test Notification",
      message: "This is a direct push test from the server!",
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      tag: "manual-test",
      requireInteraction: true,
      data: {
        type: "manual_test",
        timestamp: Date.now(),
        url: "/notifications",
      },
    };

    // Send push notification directly
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    console.log(
      "📤 Sending manual push to:",
      subscription.endpoint.substring(0, 50) + "..."
    );

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(testPayload),
      {
        TTL: 60, // 1 minute
        urgency: "high",
      }
    );

    console.log("✅ Manual push sent successfully!");

    return Response.json({
      success: true,
      message: "Manual push notification sent successfully!",
      debug: {
        userId,
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        payload: testPayload,
        vapidConfigured: true,
      },
    });
  } catch (error) {
    console.error("❌ Manual push error:", error);

    // Handle specific push errors
    if (error.statusCode === 410) {
      return Response.json(
        {
          error: "Push subscription is invalid/expired",
          debug: { statusCode: error.statusCode, message: error.message },
        },
        { status: 410 }
      );
    }

    return Response.json(
      {
        error: "Failed to send manual push",
        debug: {
          message: error.message,
          statusCode: error.statusCode,
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
