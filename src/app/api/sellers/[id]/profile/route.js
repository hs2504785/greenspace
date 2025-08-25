import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = createSupabaseClient();

    // Get seller farm profile
    const { data: profile, error } = await supabase
      .from("seller_farm_profiles")
      .select(
        `
        *,
        seller:users(
          id, 
          name, 
          business_name, 
          whatsapp_number, 
          phone, 
          location,
          avatar_url
        )
      `
      )
      .eq("seller_id", id)
      .eq("public_profile", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw error;
    }

    if (!profile) {
      // If no farm profile exists, try to get basic seller info
      const { data: seller, error: sellerError } = await supabase
        .from("users")
        .select(
          "id, name, business_name, whatsapp_number, phone, location, avatar_url, role"
        )
        .eq("id", id)
        .eq("role", "seller")
        .single();

      if (sellerError) {
        return NextResponse.json(
          { error: "Seller not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        seller,
        profile_exists: false,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller profile" },
      { status: 500 }
    );
  }
}
