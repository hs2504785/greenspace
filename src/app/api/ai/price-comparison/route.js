import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get("product");
    const location = searchParams.get("location");
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!supabase) {
      throw new Error("Database not available");
    }

    // Build query to compare prices across sellers
    let dbQuery = supabase
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
        source_type,
        created_at,
        owner:users!vegetables_owner_id_fkey (
          id,
          name,
          phone,
          whatsapp_number,
          location,
          seller_farm_profiles (
            farm_name,
            verification_level,
            trust_score
          )
        )
      `
      )
      .gt("quantity", 0); // Only available products

    // Apply filters
    if (productName) {
      dbQuery = dbQuery.ilike("name", `%${productName}%`);
    }

    if (location) {
      dbQuery = dbQuery.ilike("location", `%${location}%`);
    }

    if (category && category !== "All") {
      dbQuery = dbQuery.eq("category", category);
    }

    // Order by price (lowest first) and limit
    dbQuery = dbQuery.order("price", { ascending: true }).limit(limit);

    const { data: products, error } = await dbQuery;

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message);
    }

    // Calculate price statistics
    const prices = products?.map((p) => parseFloat(p.price)) || [];
    const priceStats =
      prices.length > 0
        ? {
            lowest: Math.min(...prices),
            highest: Math.max(...prices),
            average: prices.reduce((a, b) => a + b, 0) / prices.length,
            median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
            total_options: prices.length,
          }
        : null;

    // Group by seller for comparison
    const sellerComparison = {};
    products?.forEach((product) => {
      const sellerId = product.owner?.id;
      if (!sellerComparison[sellerId]) {
        const profile = product.owner?.seller_farm_profiles?.[0];
        sellerComparison[sellerId] = {
          seller_id: sellerId,
          seller_name: product.owner?.name || "Unknown",
          seller_location: product.owner?.location,
          farm_name: profile?.farm_name,
          verification_level: profile?.verification_level || "pending",
          trust_score: profile?.trust_score || 0,
          contact: {
            phone: product.owner?.phone,
            whatsapp: product.owner?.whatsapp_number,
          },
          products: [],
        };
      }

      sellerComparison[sellerId].products.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: product.quantity,
        category: product.category,
        source_type: product.source_type,
        created_at: product.created_at,
      });
    });

    // Convert to array and sort by lowest price
    const sellerArray = Object.values(sellerComparison)
      .map((seller) => {
        const lowestPrice = Math.min(...seller.products.map((p) => p.price));
        return {
          ...seller,
          lowest_price: lowestPrice,
          product_count: seller.products.length,
        };
      })
      .sort((a, b) => a.lowest_price - b.lowest_price);

    // Format for AI consumption
    const formattedComparison = {
      search_query: productName || "all products",
      location_filter: location,
      category_filter: category,
      price_statistics: priceStats,
      sellers: sellerArray,
      recommendations: {
        best_value: sellerArray[0] || null,
        most_trusted:
          sellerArray.sort((a, b) => b.trust_score - a.trust_score)[0] || null,
        local_options: location
          ? sellerArray.filter((s) =>
              s.seller_location?.toLowerCase().includes(location.toLowerCase())
            )
          : [],
      },
    };

    return NextResponse.json({
      success: true,
      comparison: formattedComparison,
      total_sellers: sellerArray.length,
      total_products: products?.length || 0,
      search_params: {
        product: productName,
        location,
        category,
        limit,
      },
    });
  } catch (error) {
    console.error("Price comparison API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not fetch price comparison data",
        comparison: null,
      },
      { status: 500 }
    );
  }
}
