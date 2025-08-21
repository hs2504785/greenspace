import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrderService from "@/services/OrderService";

// Store AI-generated orders in memory for demo (in production, use a real database)
const aiOrders = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📦 Creating new order:", body);

    // Get user session
    const session = await getServerSession(authOptions);

    // Generate order ID
    const orderId = generateUUID();

    // Create order object
    const order = {
      id: orderId,
      user_id: session?.user?.id || "guest",
      seller_id: body.sellerId || "0e13a58b-a5e2-4ed3-9c69-9634c7413550", // Default to Arya Natural Farms
      status: "confirmed",
      payment_status: body.payment_status || "pay_later",
      total_amount: parseFloat(body.total_amount || body.total || 0),
      delivery_address:
        body.delivery_address || session?.user?.location || "Hyderabad, India",
      contact_number: body.contact_number || body.phone || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Items data
      items: body.items || [
        {
          id: Date.now().toString(),
          quantity: body.quantity || 1,
          price_per_unit: parseFloat(body.unit_price || body.price || 0),
          total_price: parseFloat(body.total_amount || body.total || 0),
          vegetable: {
            id: body.product_id || Date.now().toString(),
            name: body.product_name || body.item_name,
            description: `Fresh ${
              body.product_name || body.item_name
            } from local farms`,
            category: "Vegetables",
            images: ["/images/vegetables/default.jpg"],
          },
        },
      ],
      // Seller info
      seller: {
        id: body.sellerId || "0e13a58b-a5e2-4ed3-9c69-9634c7413550",
        name: body.seller_name || "Arya Natural Farms",
        email: "aryanaturalfarms@gmail.com",
        location: "Hyderabad",
        whatsapp_number: "7799111008",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocKR0UcjXY9OI1ee_NLazlyOMRQExCuK2WLK7iMSYK5cvALqGA=s96-c",
      },
    };

    // Store the order (in memory for demo)
    aiOrders.set(orderId, order);
    console.log("✅ Order created with ID:", orderId);

    // Try to save to real database if available
    try {
      await OrderService.createOrder({
        userId: order.user_id,
        sellerId: order.seller_id,
        total: order.total_amount,
        deliveryAddress: order.delivery_address,
        contactNumber: order.contact_number,
        items: order.items,
      });
      console.log("✅ Order also saved to database");
    } catch (dbError) {
      console.log(
        "ℹ️ Database save failed, using memory storage:",
        dbError.message
      );
    }

    return NextResponse.json({
      success: true,
      order: order,
      order_id: orderId,
      order_url: `http://localhost:3000/orders/${orderId}`,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (orderId) {
      // Get specific order
      const order = aiOrders.get(orderId);
      if (order) {
        return NextResponse.json({ success: true, order });
      } else {
        // Try to get from database via OrderService
        try {
          const dbOrder = await OrderService.getOrderById(orderId);
          if (dbOrder) {
            return NextResponse.json({ success: true, order: dbOrder });
          }
        } catch (dbError) {
          console.log("Order not found in database:", dbError.message);
        }
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    // Get all orders (for admin/debugging)
    const allOrders = Array.from(aiOrders.values());
    return NextResponse.json({ success: true, orders: allOrders });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error.message },
      { status: 500 }
    );
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Export the aiOrders for use in other parts of the app
export { aiOrders };
