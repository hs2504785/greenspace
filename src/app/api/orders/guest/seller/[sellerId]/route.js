import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { sellerId } = params;

    console.log("🔍 Fetching guest orders for seller:", sellerId);

    if (!sellerId) {
      return new Response(JSON.stringify({ error: "Seller ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get session to verify user is authenticated
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

    // Verify the requesting user is the seller (security check)
    if (session.user.id !== sellerId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: You can only view your own guest orders",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    // Fetch guest orders for the seller with seller information
    const { data: guestOrders, error } = await supabase
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
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching guest orders:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch guest orders",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `✅ Found ${guestOrders?.length || 0} guest orders for seller:`,
      sellerId
    );

    return new Response(
      JSON.stringify({
        success: true,
        guestOrders: guestOrders || [],
        count: guestOrders?.length || 0,
        message: "Guest orders retrieved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error fetching guest orders for seller:", error);
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
