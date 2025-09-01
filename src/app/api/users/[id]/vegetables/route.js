import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Get query parameters for filtering
    const category = searchParams.get("category");
    const searchQuery = searchParams.get("search");
    const productType = searchParams.get("productType") || "regular";
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    const supabase = createSupabaseClient();

    // Build the query
    let query = supabase
      .from("vegetables")
      .select(
        `
        *,
        owner:users!vegetables_owner_id_fkey (
          id,
          name,
          email,
          phone,
          whatsapp_number,
          location,
          avatar_url
        )
      `
      )
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    if (productType && productType !== "all") {
      query = query.eq("product_type", productType);
    } else {
      // Default to regular products only
      query = query.eq("product_type", "regular");
    }

    const { data: vegetables, error } = await query;

    if (error) {
      console.error("Error fetching user vegetables:", error);
      return NextResponse.json(
        { error: "Failed to fetch user vegetables" },
        { status: 500 }
      );
    }

    // Apply client-side search filter if provided
    let filteredVegetables = vegetables || [];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredVegetables = filteredVegetables.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query) ||
          v.location?.toLowerCase().includes(query)
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("vegetables")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id);

    if (category && category !== "All") {
      countQuery = countQuery.eq("category", category);
    }

    if (productType && productType !== "all") {
      countQuery = countQuery.eq("product_type", productType);
    } else {
      countQuery = countQuery.eq("product_type", "regular");
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.warn("Error getting count:", countError);
    }

    return NextResponse.json({
      vegetables: filteredVegetables,
      total: count || filteredVegetables.length,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    console.error("Error in GET /api/users/[id]/vegetables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
