import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const radius = parseInt(searchParams.get("radius") || "10");
    const farmingMethod = searchParams.get("farming_method");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    console.log("🔍 AI Nearby Sellers Search:", {
      location,
      radius,
      farmingMethod,
      limit,
    });

    if (!supabase) {
      throw new Error("Database not available");
    }

    // Build query to find sellers with products
    let dbQuery = supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        phone,
        whatsapp_number,
        location,
        role,
        created_at,
        seller_farm_profiles (
          farm_name,
          farm_description,
          farming_methods,
          farm_size_acres,
          years_farming,
          certifications,
          verification_level,
          trust_score,
          farm_visit_available,
          public_profile
        ),
        vegetables (
          id,
          name,
          category,
          price,
          quantity,
          source_type
        )
      `
      )
      .eq("role", "seller")
      .gt("vegetables.quantity", 0); // Only sellers with available products

    // Apply location filter if provided
    if (location) {
      dbQuery = dbQuery.ilike("location", `%${location}%`);
    }

    // Apply farming method filter if provided
    if (farmingMethod && farmingMethod !== "all") {
      dbQuery = dbQuery.contains("seller_farm_profiles.farming_methods", [
        farmingMethod,
      ]);
    }

    dbQuery = dbQuery.limit(limit);

    const { data: sellers, error } = await dbQuery;

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message);
    }

    console.log("👥 Sellers found:", sellers?.length || 0);

    // Format sellers for AI consumption
    const formattedSellers =
      sellers?.map((seller) => {
        const profile = seller.seller_farm_profiles?.[0];
        const products = seller.vegetables || [];

        return {
          id: seller.id,
          name: seller.name,
          location: seller.location,
          contact: {
            phone: seller.phone,
            whatsapp: seller.whatsapp_number,
          },
          farm: {
            name: profile?.farm_name || `${seller.name}'s Farm`,
            description: profile?.farm_description,
            size_acres: profile?.farm_size_acres,
            years_farming: profile?.years_farming,
            farming_methods: profile?.farming_methods || [],
            certifications: profile?.certifications || [],
            verification_level: profile?.verification_level || "pending",
            trust_score: profile?.trust_score || 0,
            visit_available: profile?.farm_visit_available || false,
          },
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: `₹${p.price}`,
            quantity: p.quantity,
            source_type: p.source_type,
          })),
          product_count: products.length,
          available_products: products.filter((p) => p.quantity > 0).length,
        };
      }) || [];

    return NextResponse.json({
      success: true,
      sellers: formattedSellers,
      count: formattedSellers.length,
      search_params: {
        location,
        radius,
        farming_method: farmingMethod,
        limit,
      },
    });
  } catch (error) {
    console.error("❌ Nearby sellers API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not fetch nearby sellers",
        sellers: [],
      },
      { status: 500 }
    );
  }
}
