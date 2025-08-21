import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    console.log("🔍 AI Order Search:", { orderId, phone, email, userId });

    if (!supabase) {
      throw new Error("Database not available");
    }

    // If specific order ID is provided
    if (orderId) {
      // Try regular orders first
      let { data: order, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          delivery_address,
          contact_number,
          created_at,
          updated_at,
          order_items (
            quantity,
            price_per_unit,
            total_price,
            vegetable:vegetables (
              name,
              category
            )
          ),
          seller:users!orders_seller_id_fkey (
            name,
            phone,
            whatsapp_number
          )
        `
        )
        .eq("id", orderId)
        .single();

      // If not found in regular orders, try guest orders
      if (error || !order) {
        const { data: guestOrder, error: guestError } = await supabase
          .from("guest_orders")
          .select(
            `
            id,
            status,
            total_amount,
            delivery_address,
            contact_number,
            customer_name,
            customer_email,
            created_at,
            updated_at,
            items,
            seller:users!guest_orders_seller_id_fkey (
              name,
              phone,
              whatsapp_number
            )
          `
          )
          .eq("id", orderId)
          .single();

        if (guestError || !guestOrder) {
          return NextResponse.json(
            {
              success: false,
              error: "Order not found",
              message:
                "No order found with this ID. Please check the order ID and try again.",
            },
            { status: 404 }
          );
        }

        // Format guest order
        order = {
          ...guestOrder,
          order_type: "guest",
          customer_info: {
            name: guestOrder.customer_name,
            email: guestOrder.customer_email,
            phone: guestOrder.contact_number,
          },
        };
      } else {
        order.order_type = "regular";
      }

      return NextResponse.json({
        success: true,
        order: formatOrderForAI(order),
      });
    }

    // Search orders by contact information
    let orders = [];

    if (phone) {
      // Search both regular and guest orders by phone
      const { data: regularOrders } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          delivery_address,
          contact_number,
          created_at,
          seller:users!orders_seller_id_fkey (name)
        `
        )
        .eq("contact_number", phone)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: guestOrders } = await supabase
        .from("guest_orders")
        .select(
          `
          id,
          status,
          total_amount,
          delivery_address,
          contact_number,
          customer_name,
          created_at,
          seller:users!guest_orders_seller_id_fkey (name)
        `
        )
        .eq("contact_number", phone)
        .order("created_at", { ascending: false })
        .limit(5);

      orders = [
        ...(regularOrders || []).map((o) => ({ ...o, order_type: "regular" })),
        ...(guestOrders || []).map((o) => ({
          ...o,
          order_type: "guest",
          customer_name: o.customer_name,
        })),
      ];
    }

    if (userId) {
      const { data: userOrders } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          delivery_address,
          contact_number,
          created_at,
          seller:users!orders_seller_id_fkey (name)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      orders = [
        ...orders,
        ...(userOrders || []).map((o) => ({ ...o, order_type: "regular" })),
      ];
    }

    // Remove duplicates and sort by date
    const uniqueOrders = orders
      .filter(
        (order, index, self) =>
          index === self.findIndex((o) => o.id === order.id)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({
      success: true,
      orders: uniqueOrders.map(formatOrderForAI),
      count: uniqueOrders.length,
      search_info: {
        phone_searched: phone,
        email_searched: email,
        user_id_searched: userId,
      },
    });
  } catch (error) {
    console.error("AI Orders API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        orders: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, orderId, phone } = await request.json();

    if (!orderId && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID or phone number is required",
        },
        { status: 400 }
      );
    }

    if (action === "track_status") {
      // Get order status and tracking information
      let order = null;
      let orderType = "regular";

      // Try regular orders first
      const { data: regularOrder, error: regularError } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          created_at,
          updated_at,
          delivery_address,
          seller:users!orders_seller_id_fkey (
            name,
            phone,
            whatsapp_number
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (regularOrder && !regularError) {
        order = regularOrder;
      } else {
        // Try guest orders
        const { data: guestOrder, error: guestError } = await supabase
          .from("guest_orders")
          .select(
            `
            id,
            status,
            total_amount,
            created_at,
            updated_at,
            delivery_address,
            customer_name,
            seller:users!guest_orders_seller_id_fkey (
              name,
              phone,
              whatsapp_number
            )
          `
          )
          .eq("id", orderId)
          .single();

        if (guestOrder && !guestError) {
          order = guestOrder;
          orderType = "guest";
        }
      }

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            error: "Order not found",
          },
          { status: 404 }
        );
      }

      const statusInfo = getOrderStatusInfo(order.status);

      return NextResponse.json({
        success: true,
        order_id: order.id,
        current_status: order.status,
        status_info: statusInfo,
        order_type: orderType,
        total_amount: `₹${order.total_amount}`,
        order_date: new Date(order.created_at).toLocaleDateString("en-IN"),
        last_updated: new Date(order.updated_at).toLocaleDateString("en-IN"),
        seller_contact: {
          name: order.seller?.name,
          phone: order.seller?.phone,
          whatsapp: order.seller?.whatsapp_number,
        },
        delivery_address: order.delivery_address,
        tracking_message: generateTrackingMessage(
          order.status,
          order.seller?.name
        ),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Supported actions: track_status",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("AI Orders POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper functions
function formatOrderForAI(order) {
  return {
    id: order.id,
    type: order.order_type,
    status: order.status,
    total_amount: `₹${order.total_amount}`,
    order_date: new Date(order.created_at).toLocaleDateString("en-IN"),
    last_updated: new Date(order.updated_at).toLocaleDateString("en-IN"),
    delivery_address: order.delivery_address,
    contact_number: order.contact_number,
    customer_name: order.customer_name || "Registered User",
    seller: order.seller?.name || "Unknown Seller",
    status_info: getOrderStatusInfo(order.status),
    items: order.order_items || order.items || [],
  };
}

function getOrderStatusInfo(status) {
  const statusMap = {
    pending: {
      message: "Order placed and waiting for seller confirmation",
      next_step: "Seller will confirm your order soon",
      estimated_time: "2-4 hours",
    },
    whatsapp_sent: {
      message: "Seller has been notified via WhatsApp",
      next_step: "Seller will confirm the order",
      estimated_time: "1-2 hours",
    },
    confirmed: {
      message: "Order confirmed by seller",
      next_step: "Seller is preparing your order",
      estimated_time: "4-8 hours",
    },
    processing: {
      message: "Order is being prepared",
      next_step: "Order will be shipped soon",
      estimated_time: "2-4 hours",
    },
    shipped: {
      message: "Order has been shipped",
      next_step: "Order is on the way to delivery address",
      estimated_time: "1-2 days",
    },
    delivered: {
      message: "Order has been delivered successfully",
      next_step: "Order completed",
      estimated_time: "Completed",
    },
    cancelled: {
      message: "Order has been cancelled",
      next_step: "You can place a new order",
      estimated_time: "N/A",
    },
  };

  return (
    statusMap[status] || {
      message: "Unknown status",
      next_step: "Contact seller for more information",
      estimated_time: "Unknown",
    }
  );
}

function generateTrackingMessage(status, sellerName) {
  const seller = sellerName || "the seller";

  switch (status) {
    case "pending":
      return `Your order is waiting for confirmation from ${seller}. They will contact you soon!`;
    case "whatsapp_sent":
      return `${seller} has been notified via WhatsApp and will confirm your order shortly.`;
    case "confirmed":
      return `Great news! ${seller} has confirmed your order and is preparing it.`;
    case "processing":
      return `${seller} is currently preparing your fresh vegetables for shipment.`;
    case "shipped":
      return `Your order is on its way! ${seller} has shipped your vegetables.`;
    case "delivered":
      return `Order delivered successfully! Enjoy your fresh vegetables from ${seller}.`;
    case "cancelled":
      return `This order was cancelled. You can place a new order anytime.`;
    default:
      return `Order status: ${status}. Contact ${seller} for more details.`;
  }
}
