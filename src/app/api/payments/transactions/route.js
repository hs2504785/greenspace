import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const orderType = searchParams.get("orderType") || "regular";
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");

    let query = supabase.from("payment_transactions").select(`
        *,
        verified_by_user:verified_by(name, email),
        orders:order_id(*, users:user_id(name, email)),
        guest_orders:guest_order_id(*)
      `);

    // Filter by order ID if provided
    if (orderId) {
      if (orderType === "guest") {
        query = query.eq("guest_order_id", orderId);
      } else {
        query = query.eq("order_id", orderId);
      }
    }

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Filter by seller if provided (for seller dashboard)
    if (sellerId) {
      query = query.or(
        `orders.seller_id.eq.${sellerId},guest_orders.seller_id.eq.${sellerId}`
      );
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching payment transactions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch payment transactions" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ transactions: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in payment transactions API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
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
    const {
      orderId,
      orderType,
      transactionType,
      amount,
      gatewayTransactionId,
      gatewayPaymentId,
      gatewayOrderId,
      gatewayResponse,
      screenshotUrl,
      failureReason,
    } = body;

    // Validate required fields
    if (!orderId || !orderType || !transactionType) {
      return new Response(
        JSON.stringify({
          error: "Order ID, order type, and transaction type are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create transaction record
    const insertData = {
      transaction_type: transactionType,
      amount,
      status: "pending",
      gateway_transaction_id: gatewayTransactionId,
      gateway_payment_id: gatewayPaymentId,
      gateway_order_id: gatewayOrderId,
      gateway_response: gatewayResponse,
      screenshot_url: screenshotUrl,
      failure_reason: failureReason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set order reference based on type
    if (orderType === "guest") {
      insertData.guest_order_id = orderId;
    } else {
      insertData.order_id = orderId;
    }

    const { data, error } = await supabase
      .from("payment_transactions")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error creating payment transaction:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create payment transaction" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: data,
        message: "Payment transaction created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in payment transactions POST API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
