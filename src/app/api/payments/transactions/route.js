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

    console.log("🔍 Payment transactions API called by user:", session.user.id);
    console.log("🔍 User session:", {
      id: session.user.id,
      email: session.user.email,
    });

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
      // Use a more complex approach since PostgREST has issues with nested OR queries
      // We'll get all transactions and filter on the server side
      console.log("🔍 Filtering by seller ID:", sellerId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching payment transactions:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // If table doesn't exist, return empty array instead of error
      if (
        error.code === "42P01" ||
        error.message?.includes("relation") ||
        error.message?.includes("does not exist")
      ) {
        console.warn(
          "⚠️ payment_transactions table doesn't exist yet, returning empty array"
        );
        return new Response(JSON.stringify({ transactions: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          error: "Failed to fetch payment transactions",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filter by seller on server side if sellerId was provided
    let filteredData = data || [];
    if (sellerId && data && Array.isArray(data)) {
      filteredData = data.filter((transaction) => {
        try {
          // Check if transaction belongs to this seller
          const order = transaction.orders || transaction.guest_orders;
          return order && order.seller_id === sellerId;
        } catch (filterError) {
          console.warn("Error filtering transaction:", filterError);
          return false;
        }
      });
      console.log(
        `🔍 Filtered ${data.length} transactions to ${filteredData.length} for seller ${sellerId}`
      );
    }

    return new Response(JSON.stringify({ transactions: filteredData }), {
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
