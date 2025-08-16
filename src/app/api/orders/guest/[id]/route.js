import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    console.log("🔍 Fetching guest order:", id);

    if (!id) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Database not available",
          details: "Supabase client not initialized",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch guest order with seller information
    const { data: guestOrder, error } = await supabase
      .from("guest_orders")
      .select(
        `
        *,
        seller:users!guest_orders_seller_id_fkey (
          id,
          name,
          email,
          avatar_url,
          location,
          whatsapp_number,
          phone
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching guest order:", error);

      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: "Guest order not found",
            details: "No guest order exists with this ID",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to fetch guest order",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!guestOrder) {
      return new Response(
        JSON.stringify({
          error: "Guest order not found",
          details: "No guest order exists with this ID",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Guest order found:", guestOrder.id);

    return new Response(
      JSON.stringify({
        success: true,
        guestOrder,
        message: "Guest order retrieved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error fetching guest order:", error);
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
