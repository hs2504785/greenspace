import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = parseInt(searchParams.get("offset")) || 0;

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
        *,
        buyer:users!product_reviews_buyer_id_fkey(name, avatar_url),
        product:vegetables(name, images)
      `
      )
      .eq("seller_id", id)
      .eq("status", "active")
      .eq("flagged", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller reviews" },
      { status: 500 }
    );
  }
}
