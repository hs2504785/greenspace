import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { userId, itemName, quantity, maxPrice, userPhone, userLocation } =
      await request.json();

    console.log("🛒 AI Instant Order:", {
      userId,
      itemName,
      quantity,
      maxPrice,
    });

    if (!itemName) {
      return NextResponse.json(
        { success: false, error: "Item name is required" },
        { status: 400 }
      );
    }

    // First, search for available products matching the item
    let productQuery = supabase
      .from("vegetables")
      .select(
        `
        id,
        name,
        description,
        price,
        quantity,
        category,
        location,
        owner:users!vegetables_owner_id_fkey (
          id,
          name,
          phone,
          whatsapp_number,
          location
        )
      `
      )
      .ilike("name", `%${itemName}%`)
      .gt("quantity", 0);

    if (maxPrice) {
      productQuery = productQuery.lte("price", maxPrice);
    }

    // Prefer products from user's location if available
    if (userLocation) {
      productQuery = productQuery.ilike("location", `%${userLocation}%`);
    }

    productQuery = productQuery.order("price", { ascending: true }).limit(5);

    const { data: products, error: productError } = await productQuery;

    if (productError) {
      throw new Error(productError.message);
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Sorry, ${itemName} is not available right now. Would you like to add it to your wishlist?`,
        suggestion: "wishlist",
        itemName: itemName,
      });
    }

    // Select the best product (cheapest, from user's location if possible)
    const selectedProduct = products[0];
    const orderQuantity = Math.min(quantity || 1, selectedProduct.quantity);
    const totalAmount = selectedProduct.price * orderQuantity;

    // Create the order
    const orderData = {
      buyer_id: userId || null,
      seller_id: selectedProduct.owner.id,
      product_id: selectedProduct.id,
      quantity: orderQuantity,
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending",
      delivery_address: userLocation || "To be provided",
      buyer_phone: userPhone || "To be provided",
      order_type: "instant_chat",
      created_at: new Date().toISOString(),
    };

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select(
        `
        id,
        quantity,
        total_amount,
        status,
        payment_status,
        created_at,
        product:vegetables (
          name,
          price,
          category
        ),
        seller:users!orders_seller_id_fkey (
          name,
          phone,
          whatsapp_number,
          location
        )
      `
      )
      .single();

    if (orderError) {
      throw new Error(orderError.message);
    }

    // Format the response for AI
    const orderResponse = {
      success: true,
      message: `✅ **Order Created Successfully!**`,
      order: {
        id: newOrder.id,
        product: selectedProduct.name,
        quantity: `${orderQuantity}kg`,
        pricePerKg: `₹${selectedProduct.price}`,
        totalAmount: `₹${totalAmount}`,
        seller: {
          name: newOrder.seller.name,
          location: newOrder.seller.location,
          contact: newOrder.seller.whatsapp_number || newOrder.seller.phone,
        },
        status: "Pending Payment",
        paymentStatus: "Pay Later Option Available",
        trackingUrl: `/orders/${newOrder.id}`,
      },
      nextSteps: [
        "📱 Contact seller to arrange payment and delivery",
        "💰 Pay using UPI when you receive the product",
        "📦 Track your order status in the dashboard",
        "⭐ Rate your experience after delivery",
      ],
      paymentInfo: {
        method: "UPI Payment on Delivery",
        note: "You can pay when you receive the product",
        apps: ["Google Pay", "PhonePe", "Paytm", "BHIM"],
      },
    };

    return NextResponse.json(orderResponse);
  } catch (error) {
    console.error("❌ Instant order error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not create order at the moment. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
