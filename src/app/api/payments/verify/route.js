import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { supabase } from "@/lib/supabase";

export async function PATCH(request) {
  try {
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

    const body = await request.json();
    const { transactionId, isApproved, notes } = body;

    if (!transactionId || typeof isApproved !== "boolean") {
      return new Response(
        JSON.stringify({
          error: "Transaction ID and approval status are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get transaction details first
    const { data: transaction, error: fetchError } = await supabase
      .from("payment_transactions")
      .select(
        `
        *,
        orders:order_id(*),
        guest_orders:guest_order_id(*)
      `
      )
      .eq("id", transactionId)
      .single();

    if (fetchError) {
      console.error("Error fetching transaction:", fetchError);
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = transaction.orders || transaction.guest_orders;
    const orderType = transaction.orders ? "regular" : "guest";
    const tableName = orderType === "guest" ? "guest_orders" : "orders";

    // Check if user is authorized (seller of the order or admin)
    const isOrderSeller = order.seller_id === session.user.id;

    // Get user role to check if admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const isAdmin = userData?.role === "admin";

    if (!isOrderSeller && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized to verify this payment" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update transaction status
    const transactionStatus = isApproved ? "success" : "failed";
    const { error: transactionUpdateError } = await supabase
      .from("payment_transactions")
      .update({
        status: transactionStatus,
        verified_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (transactionUpdateError) {
      console.error("Error updating transaction:", transactionUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update transaction status" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update order status
    const orderStatus = isApproved ? "confirmed" : "payment_pending";
    const paymentStatus = isApproved ? "success" : "failed";

    const { error: orderUpdateError } = await supabase
      .from(tableName)
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_verified_at: isApproved ? new Date().toISOString() : null,
        payment_verified_by: isApproved ? session.user.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (orderUpdateError) {
      console.error("Error updating order:", orderUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isApproved
          ? "Payment verified and order confirmed"
          : "Payment rejected",
        transactionStatus,
        orderStatus,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in payment verification API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
