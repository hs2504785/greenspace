import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { supabase } from "@/lib/supabase";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status, notes } = await request.json();

    console.log("🔄 Updating guest order status:", { id, status, notes });

    if (!id || !status) {
      return new Response(
        JSON.stringify({ error: "Order ID and status are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate status
    const validStatuses = [
      "whatsapp_sent",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({
          error: "Invalid status",
          details: `Status must be one of: ${validStatuses.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get session to verify user is the seller
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // First, verify the user is the seller for this order
    const { data: order, error: fetchError } = await supabase
      .from("guest_orders")
      .select("seller_id")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({
          error: "Guest order not found",
          details: fetchError?.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (order.seller_id !== session.user.id) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: You can only update your own orders",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the order status
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("guest_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating guest order:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update guest order",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Guest order status updated:", updatedOrder.id);

    return new Response(
      JSON.stringify({
        success: true,
        guestOrder: updatedOrder,
        message: "Guest order status updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error updating guest order status:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
