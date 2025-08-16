import { supabase } from "@/lib/supabase";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { guestDetails, items, total, seller, timestamp } = body;

    console.log("🛒 Guest order API called with:", {
      guestName: guestDetails?.name,
      sellerID: seller?.id,
      totalAmount: total,
      itemCount: items?.length,
    });

    // Validate required fields
    if (!guestDetails?.name || !guestDetails?.phone || !guestDetails?.address) {
      return new Response(
        JSON.stringify({ error: "Guest details are incomplete" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Order items are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!seller?.id) {
      return new Response(
        JSON.stringify({ error: "Seller information is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Try to create guest order record using service role to bypass RLS
    let guestOrder = null;
    let orderError = null;

    try {
      // Use service role client to bypass RLS policies for guest orders
      const adminClient = createSupabaseClient();

      const { data, error } = await adminClient
        .from("guest_orders")
        .insert([
          {
            guest_name: guestDetails.name,
            guest_phone: guestDetails.phone,
            guest_email: guestDetails.email || null,
            guest_address: guestDetails.address,
            seller_id: seller.id,
            total_amount: total,
            order_items: items, // Store as JSON
            status: "whatsapp_sent",
            created_at: timestamp,
          },
        ])
        .select()
        .single();

      guestOrder = data;
      orderError = error;
    } catch (insertError) {
      console.error("Insert error:", insertError);
      orderError = insertError;

      // Fallback to regular client if service role fails
      if (insertError.message?.includes("configuration")) {
        console.log("Falling back to regular supabase client...");
        try {
          const { data, error } = await supabase
            .from("guest_orders")
            .insert([
              {
                guest_name: guestDetails.name,
                guest_phone: guestDetails.phone,
                guest_email: guestDetails.email || null,
                guest_address: guestDetails.address,
                seller_id: seller.id,
                total_amount: total,
                order_items: items,
                status: "whatsapp_sent",
                created_at: timestamp,
              },
            ])
            .select()
            .single();

          guestOrder = data;
          orderError = error;
        } catch (fallbackError) {
          console.error("Fallback insert also failed:", fallbackError);
          orderError = fallbackError;
        }
      }
    }

    if (orderError) {
      console.error("Error creating guest order:", orderError);

      // Check if the table doesn't exist - still allow WhatsApp order to proceed
      if (orderError.code === "42P01") {
        // table doesn't exist - not a critical error, WhatsApp order can still work
        console.warn(
          "guest_orders table not found, proceeding without database storage"
        );
        return new Response(
          JSON.stringify({
            success: true,
            warning:
              "Order details not saved to database (table not found), but WhatsApp order can proceed",
            details:
              "To enable guest order tracking, run: src/db/migrations/add_guest_orders_table.sql",
            guestOrder: {
              id: `temp-${Date.now()}`, // temporary ID for frontend
              guest_name: guestDetails.name,
              guest_phone: guestDetails.phone,
              status: "whatsapp_sent",
            },
          }),
          {
            status: 200, // Success despite no database storage
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // For other database errors, still allow WhatsApp order but warn
      console.error("Database error but allowing WhatsApp order to proceed:", {
        error: orderError,
        code: orderError?.code,
        message: orderError?.message,
        hint: orderError?.hint,
      });

      return new Response(
        JSON.stringify({
          success: true,
          warning: "Order details might not be saved to database",
          details: `Database error: ${orderError.message} (Code: ${orderError?.code})`,
          debugInfo: {
            errorCode: orderError?.code,
            errorMessage: orderError?.message,
            errorHint: orderError?.hint,
            timestamp: new Date().toISOString(),
          },
          guestOrder: {
            id: `temp-${Date.now()}`, // temporary ID for frontend
            guest_name: guestDetails.name,
            guest_phone: guestDetails.phone,
            status: "whatsapp_sent",
          },
        }),
        {
          status: 200, // Success despite database issues
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        guestOrder,
        message: "Guest order saved successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
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
