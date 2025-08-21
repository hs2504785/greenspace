import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrderService from "@/services/OrderService";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("🤖 AI Order Creation Request:", body);

    // Get user session
    const session = await getServerSession(authOptions);

    console.log("🔐 AI Order Session Check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    });

    if (!body.vegetable_id || !body.seller_id) {
      return NextResponse.json(
        { error: "Missing required fields: vegetable_id, seller_id" },
        { status: 400 }
      );
    }

    // Structure order data exactly like the working manual checkout
    const orderData = {
      userId: session?.user?.id || null, // Handle guest users (NULL for database compatibility)
      sellerId: body.seller_id,
      items: [
        {
          id: body.vegetable_id, // This is the key - must be the actual vegetable ID from database
          quantity: body.quantity || 1,
          price: parseFloat(body.unit_price || 0),
        },
      ],
      total: parseFloat(body.total_amount || 0),
      deliveryAddress: body.delivery_address || "Address not provided",
      contactNumber: body.contact_number || "",
    };

    console.log("🔄 Creating order with OrderService:", orderData);

    // Use the same OrderService.createOrder() method as manual checkout
    const order = await OrderService.createOrder(orderData);

    console.log("✅ AI Order created successfully:", order.id);

    return NextResponse.json({
      success: true,
      order: order,
      order_id: order.id,
      order_url: `http://localhost:3000/orders/${order.id}`,
    });
  } catch (error) {
    console.error("❌ AI Order creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
