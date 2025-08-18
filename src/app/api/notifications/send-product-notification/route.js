import { createSupabaseClient } from "@/utils/supabaseAuth";
import webpush from "web-push";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

// Configure web-push with VAPID keys
const vapidEmail =
  process.env.VAPID_EMAIL || "mailto:admin@aryanaturalarms.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID keys not configured - push notifications will not work");
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, productName, sellerId, sellerName } = await req.json();

    if (!productId || !productName || !sellerId) {
      return Response.json(
        {
          error: "Missing required fields: productId, productName, sellerId",
        },
        { status: 400 }
      );
    }

    // Check VAPID configuration
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return Response.json(
        {
          error: "Push notifications not configured",
          details: "VAPID keys missing",
        },
        { status: 500 }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createSupabaseClient();

    // Get all users with notification preferences enabled (except the seller)
    const { data: usersToNotify, error: usersError } = await supabase
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
      .eq("push_enabled", true)
      .neq("user_id", sellerId);

    if (usersError) {
      console.error("Error fetching users to notify:", usersError);
      return Response.json(
        {
          error: "Failed to fetch users to notify",
          details: usersError.message,
        },
        { status: 500 }
      );
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      console.log("No users to notify for new product");
      return Response.json({
        success: true,
        message: "No users have opted in for new product notifications",
        notificationsSent: 0,
      });
    }

    // Get push subscriptions for these users
    const userIds = usersToNotify.map((user) => user.user_id);
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subsError) {
      console.error("Error fetching push subscriptions:", subsError);
      return Response.json(
        {
          error: "Failed to fetch push subscriptions",
          details: subsError.message,
        },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active push subscriptions found");
      return Response.json({
        success: true,
        message: "No active push subscriptions found",
        notificationsSent: 0,
      });
    }

    // Prepare notification data
    const notificationPayload = {
      title: "🥬 New Fresh Product Available!",
      message: `${
        sellerName || "A seller"
      } just added "${productName}" to the marketplace`,
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-192x192.png",
      url: `/vegetables/${productId}`,
      tag: "new-product",
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Product",
          icon: "/favicon/android-chrome-192x192.png",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
      data: {
        productId,
        productName,
        sellerId,
        sellerName: sellerName || "A seller",
        type: "new_product",
        url: `/vegetables/${productId}`,
        timestamp: Date.now(),
      },
    };

    // Send push notifications
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          {
            TTL: 86400, // 24 hours
            urgency: "normal",
          }
        );

        return {
          success: true,
          userId: subscription.user_id,
          endpoint: subscription.endpoint.substring(0, 50) + "...", // Truncate for logging
        };
      } catch (error) {
        console.error(
          `Failed to send push notification to user ${subscription.user_id}:`,
          error
        );

        // If subscription is invalid (410 Gone), mark for removal
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(
            `Removing invalid subscription for user ${subscription.user_id}`
          );
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }

        return {
          success: false,
          userId: subscription.user_id,
          error: error.message,
          statusCode: error.statusCode,
        };
      }
    });

    const results = await Promise.allSettled(pushPromises);
    const successfulResults = results
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => r.value);

    const failedResults = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => r.value);

    // Store notification records in database
    const notificationRecords = usersToNotify.map((user) => ({
      user_id: user.user_id,
      title: notificationPayload.title,
      message: notificationPayload.message,
      type: "new_product",
      data: notificationPayload.data,
      sent_push: successfulResults.some((r) => r.userId === user.user_id),
    }));

    if (notificationRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationRecords);

      if (insertError) {
        console.error("Error storing notification records:", insertError);
        // Don't fail the entire operation if logging fails
      }
    }

    const successCount = successfulResults.length;
    const failedCount = failedResults.length;

    console.log(
      `Push notifications sent: ${successCount} successful, ${failedCount} failed`
    );

    return Response.json({
      success: true,
      message: `Sent ${successCount} notifications out of ${subscriptions.length} subscriptions`,
      notificationsSent: successCount,
      notificationsFailed: failedCount,
      usersEligible: usersToNotify.length,
      activeSubscriptions: subscriptions.length,
      results: {
        successful: successfulResults,
        failed: failedResults,
      },
    });
  } catch (error) {
    console.error("Send notification API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
