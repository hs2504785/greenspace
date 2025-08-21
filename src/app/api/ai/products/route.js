import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50); // Max 50 items
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Enhanced debugging for production
    console.log("🔍 AI Product Search:", { query, category, location, limit });
    console.log("🌍 Request URL:", request.url);
    console.log("🔧 Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlPrefix:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    });

    if (!supabase) {
      throw new Error("Database not available");
    }

    // Build the query
    let dbQuery = supabase.from("vegetables").select(`
        id,
        name,
        description,
        price,
        quantity,
        category,
        location,
        source_type,
        images,
        created_at,
        owner:users!vegetables_owner_id_fkey (
          id,
          name,
          phone,
          whatsapp_number,
          location
        )
      `);

    // Apply filters
    if (query) {
      // Search across multiple fields using or condition - fix syntax
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%, description.ilike.%${query}%, category.ilike.%${query}%`
      );
    }

    if (category && category !== "All") {
      dbQuery = dbQuery.eq("category", category);
    }

    if (location) {
      dbQuery = dbQuery.ilike("location", `%${location}%`);
    }

    if (minPrice) {
      dbQuery = dbQuery.gte("price", parseFloat(minPrice));
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte("price", parseFloat(maxPrice));
    }

    // Only show products with quantity > 0
    dbQuery = dbQuery.gt("quantity", 0);

    // Order by created_at desc and limit
    dbQuery = dbQuery.order("created_at", { ascending: false }).limit(limit);

    const { data: products, error } = await dbQuery;

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message);
    }

    // Debug: Show which products we found
    console.log("📋 Products found:", products?.length || 0);
    if (products && products.length > 0) {
      console.log(
        "🏷️ First few product names:",
        products.slice(0, 3).map((p) => p.name)
      );
      console.log(
        "💰 First few prices:",
        products.slice(0, 3).map((p) => `₹${p.price}`)
      );
    }

    // Format products for AI consumption
    const formattedProducts =
      products?.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: `₹${product.price}`,
        quantity: product.quantity,
        category: product.category,
        location: product.location,
        source_type: product.source_type,
        seller: {
          name: product.owner?.name || "Unknown",
          phone: product.owner?.phone,
          whatsapp: product.owner?.whatsapp_number,
          location: product.owner?.location,
        },
        availability: product.quantity > 0 ? "Available" : "Out of Stock",
        created_at: product.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
      query_info: {
        search_query: query,
        category_filter: category,
        location_filter: location,
        price_range:
          minPrice || maxPrice
            ? `₹${minPrice || 0} - ₹${maxPrice || "∞"}`
            : null,
      },
    });
  } catch (error) {
    console.error("AI Products API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        products: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, productId, quantity } = await request.json();

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    if (action === "get_details") {
      // Get detailed product information
      const { data: product, error } = await supabase
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
        .eq("id", productId)
        .single();

      if (error || !product) {
        return NextResponse.json(
          {
            success: false,
            error: "Product not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        product: {
          ...product,
          price_formatted: `₹${product.price}`,
          availability: product.quantity > 0 ? "Available" : "Out of Stock",
          seller_contact: {
            name: product.owner?.name,
            phone: product.owner?.phone,
            whatsapp: product.owner?.whatsapp_number,
            location: product.owner?.location,
          },
        },
      });
    }

    if (action === "check_availability") {
      const { data: product, error } = await supabase
        .from("vegetables")
        .select("quantity, name, price")
        .eq("id", productId)
        .single();

      if (error || !product) {
        return NextResponse.json(
          {
            success: false,
            error: "Product not found",
          },
          { status: 404 }
        );
      }

      const requestedQty = quantity || 1;
      const available = product.quantity >= requestedQty;

      return NextResponse.json({
        success: true,
        product_name: product.name,
        available_quantity: product.quantity,
        requested_quantity: requestedQty,
        can_fulfill: available,
        price_per_unit: `₹${product.price}`,
        total_price: available
          ? `₹${(product.price * requestedQty).toFixed(2)}`
          : null,
        message: available
          ? `Yes! ${requestedQty} units of ${
              product.name
            } are available for ₹${(product.price * requestedQty).toFixed(2)}`
          : `Sorry, only ${product.quantity} units available. You requested ${requestedQty} units.`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid action. Supported actions: get_details, check_availability",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("AI Products POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
