/**
 * API Route: /api/nearby-products
 * Handles fetching nearby products based on user location
 */

import { NextResponse } from "next/server";
import LocationService from "../../../services/LocationService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude"));
    const longitude = parseFloat(searchParams.get("longitude"));
    const radius = parseFloat(searchParams.get("radius")) || 50;
    const category = searchParams.get("category");
    const minPrice = parseFloat(searchParams.get("minPrice"));
    const maxPrice = parseFloat(searchParams.get("maxPrice"));
    const organic = searchParams.get("organic") === "true";

    // Validate coordinates
    if (!LocationService.isValidCoordinates(latitude, longitude)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
        },
        { status: 400 }
      );
    }

    // Validate radius
    if (radius <= 0 || radius > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Radius must be between 1 and 500 kilometers.",
        },
        { status: 400 }
      );
    }

    // Get nearby products
    let products = await LocationService.getNearbyProducts(
      latitude,
      longitude,
      radius
    );

    // Apply additional filters if provided
    if (category) {
      products = products.filter(
        (product) =>
          product.product_category &&
          product.product_category
            .toLowerCase()
            .includes(category.toLowerCase())
      );
    }

    if (!isNaN(minPrice)) {
      products = products.filter(
        (product) => product.product_price >= minPrice
      );
    }

    if (!isNaN(maxPrice)) {
      products = products.filter(
        (product) => product.product_price <= maxPrice
      );
    }

    if (organic) {
      products = products.filter((product) => product.organic === true);
    }

    // Group products by seller for easier display
    const groupedBySeller = products.reduce((acc, product) => {
      const sellerId = product.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller_id: sellerId,
          seller_name: product.seller_name,
          seller_phone: product.seller_phone,
          seller_whatsapp: product.seller_whatsapp,
          distance_km: product.distance_km,
          products: [],
        };
      }
      acc[sellerId].products.push({
        id: product.product_id,
        name: product.product_name,
        description: product.product_description,
        price: product.product_price,
        quantity: product.product_quantity,
        category: product.product_category,
        images: product.product_images,
      });
      return acc;
    }, {});

    const sellersWithProducts = Object.values(groupedBySeller);

    return NextResponse.json({
      success: true,
      data: {
        products: products,
        sellers_with_products: sellersWithProducts,
        total_products: products.length,
        total_sellers: sellersWithProducts.length,
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        organic,
        radius,
      },
      user_location: { latitude, longitude },
    });
  } catch (error) {
    console.error("Error in nearby-products API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch nearby products",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
