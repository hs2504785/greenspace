import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🧪 Manual notification test triggered by:", session.user.name);

    // Test notification payload
    const testPayload = {
      productId: "test-123",
      productName: "Test Tomato",
      sellerId: session.user.id,
      sellerName: session.user.name,
    };

    console.log("🔔 Sending test notification with payload:", testPayload);

    // Call the notification API directly
    const notificationResponse = await fetch(
      `${req.nextUrl.origin}/api/notifications/send-product-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("Cookie") || "",
        },
        body: JSON.stringify(testPayload),
      }
    );

    const notificationResult = await notificationResponse.json();

    console.log("📋 Notification API response:", {
      status: notificationResponse.status,
      ok: notificationResponse.ok,
      result: notificationResult,
    });

    if (notificationResponse.ok) {
      return Response.json({
        success: true,
        message: "Test notification sent successfully!",
        details: notificationResult,
        debug: {
          triggeredBy: session.user.name,
          testProduct: testPayload.productName,
          apiResponse: notificationResult,
        },
      });
    } else {
      return Response.json(
        {
          success: false,
          error: "Failed to send test notification",
          details: notificationResult,
          debug: {
            status: notificationResponse.status,
            triggeredBy: session.user.name,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("🚨 Test notification error:", error);
    return Response.json(
      {
        success: false,
        error: "Test notification failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
