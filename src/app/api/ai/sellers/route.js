import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const radius = parseInt(searchParams.get("radius") || "10");
    const farmingMethod = searchParams.get("farmingMethod");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    console.log("🔍 AI Seller Search:", {
      location,
      radius,
      farmingMethod,
      limit,
    });

    if (!supabase) {
      throw new Error("Database not available");
    }

    // Build the query for sellers (users with role 'seller' or who have products)
    let dbQuery = supabase.from("users").select(`
        id,
        name,
        email,
        phone,
        whatsapp_number,
        location,
        role,
        latitude,
        longitude,
        created_at,
        seller_requests!seller_requests_user_id_fkey!inner (
          id,
          status,
          business_name,
          business_description,
          farm_name,
          farm_description,
          farming_methods,
          farm_size_acres,
          years_farming,
          certifications,
          verification_level,
          trust_score,
          farm_visit_available
        ),
        vegetables (
          id,
          name,
          category,
          price,
          quantity
        )
      `);

    // Filter by approved sellers only
    dbQuery = dbQuery.eq("seller_requests.status", "approved");

    // Apply farming method filter
    if (farmingMethod && farmingMethod !== "all") {
      dbQuery = dbQuery.contains("seller_requests.farming_methods", [
        farmingMethod,
      ]);
    }

    // Apply location filter if provided
    if (location) {
      dbQuery = dbQuery.or(
        `location.ilike.%${location}%,seller_requests.business_description.ilike.%${location}%`
      );
    }

    // Order by verification level and trust score
    dbQuery = dbQuery
      .order("seller_requests.trust_score", { ascending: false })
      .limit(limit);

    const { data: sellers, error } = await dbQuery;

    if (error) {
      console.error("Database error:", error);
      console.log(
        "🔄 Falling back to simple user query without seller_requests"
      );

      // Fallback: Just get users with vegetables (sellers)
      const { data: fallbackSellers, error: fallbackError } = await supabase
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
          vegetables (
            id,
            name,
            category,
            price,
            quantity
          )
        `
        )
        .eq("role", "seller")
        .limit(limit);

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      // Format fallback sellers
      const formattedFallbackSellers =
        fallbackSellers
          ?.filter((seller) => seller.vegetables?.length > 0)
          .map((seller) => {
            const productCount = seller.vegetables?.length || 0;
            const availableProducts =
              seller.vegetables?.filter((v) => v.quantity > 0).length || 0;

            return {
              id: seller.id,
              name: seller.name,
              businessName: seller.name,
              location: seller.location,
              contact: {
                phone: seller.phone,
                whatsapp: seller.whatsapp_number,
              },
              farm: {
                name: seller.name + "'s Farm",
                description: "Local farm selling fresh vegetables",
                methods: ["natural"],
                visitAvailable: false,
              },
              verification: {
                level: "basic",
                trustScore: 50,
                status: "active",
              },
              products: {
                total: productCount,
                available: availableProducts,
                categories: [
                  ...new Set(seller.vegetables?.map((v) => v.category) || []),
                ],
              },
              joinedDate: seller.created_at,
            };
          }) || [];

      return NextResponse.json({
        success: true,
        sellers: formattedFallbackSellers,
        count: formattedFallbackSellers.length,
        query_info: { location, radius, farmingMethod, limit },
        note: "Using fallback seller data",
      });
    }

    console.log("📋 Sellers found:", sellers?.length || 0);

    // Format sellers for AI consumption
    const formattedSellers =
      sellers?.map((seller) => {
        const sellerRequest = seller.seller_requests[0] || {};
        const productCount = seller.vegetables?.length || 0;
        const availableProducts =
          seller.vegetables?.filter((v) => v.quantity > 0).length || 0;

        return {
          id: seller.id,
          name: seller.name,
          businessName: sellerRequest.business_name || seller.name,
          location: seller.location,
          contact: {
            phone: seller.phone,
            whatsapp: seller.whatsapp_number,
          },
          farm: {
            name: sellerRequest.farm_name,
            description: sellerRequest.farm_description,
            size: sellerRequest.farm_size_acres
              ? `${sellerRequest.farm_size_acres} acres`
              : null,
            experience: sellerRequest.years_farming
              ? `${sellerRequest.years_farming} years`
              : null,
            methods: sellerRequest.farming_methods || [],
            certifications: sellerRequest.certifications || [],
            visitAvailable: sellerRequest.farm_visit_available,
          },
          verification: {
            level: sellerRequest.verification_level || "pending",
            trustScore: sellerRequest.trust_score || 0,
            status: sellerRequest.status,
          },
          products: {
            total: productCount,
            available: availableProducts,
            categories: [
              ...new Set(seller.vegetables?.map((v) => v.category) || []),
            ],
          },
          joinedDate: seller.created_at,
        };
      }) || [];

    return NextResponse.json({
      success: true,
      sellers: formattedSellers,
      count: formattedSellers.length,
      query_info: {
        location,
        radius,
        farmingMethod,
        limit,
      },
    });
  } catch (error) {
    console.error("❌ Seller search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not search sellers at the moment. Please try again.",
        sellers: [],
      },
      { status: 500 }
    );
  }
}
