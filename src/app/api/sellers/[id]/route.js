/**
 * API Route: /api/sellers/[id]
 * Handles fetching individual seller details with their products
 */

import { NextResponse } from "next/server";
import LocationService from "../../../../services/LocationService";

export async function GET(request, { params }) {
  try {
    const { id: sellerId } = params;
    const { searchParams } = new URL(request.url);
    const userLatitude = parseFloat(searchParams.get("userLatitude"));
    const userLongitude = parseFloat(searchParams.get("userLongitude"));

    if (!sellerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Seller ID is required",
        },
        { status: 400 }
      );
    }

    // Validate user coordinates if provided
    if (
      userLatitude &&
      userLongitude &&
      !LocationService.isValidCoordinates(userLatitude, userLongitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user coordinates",
        },
        { status: 400 }
      );
    }

    // Get seller details with products
    const sellerData = await LocationService.getSellerWithProducts(
      sellerId,
      userLatitude,
      userLongitude
    );

    if (!sellerData) {
      return NextResponse.json(
        {
          success: false,
          error: "Seller not found",
        },
        { status: 404 }
      );
    }

    // Organize response data
    const response = {
      success: true,
      data: {
        seller: {
          id: sellerData.id,
          name: sellerData.name,
          email: sellerData.email,
          phone: sellerData.phone,
          whatsapp_number: sellerData.whatsapp_number,
          address: sellerData.address,
          city: sellerData.city,
          state: sellerData.state,
          country: sellerData.country,
          latitude: sellerData.latitude,
          longitude: sellerData.longitude,
          distance_km: sellerData.distance_km,
          created_at: sellerData.created_at,
        },
        products: sellerData.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          category: product.category,
          unit: product.unit,
          images: product.images,
          organic: product.organic,
          harvest_date: product.harvest_date,
          expiry_date: product.expiry_date,
          available: product.available,
          location: product.location,
          latitude: product.latitude,
          longitude: product.longitude,
          created_at: product.created_at,
        })),
        stats: {
          total_products: sellerData.product_count,
          available_products: sellerData.products.filter((p) => p.available)
            .length,
          categories: [
            ...new Set(sellerData.products.map((p) => p.category)),
          ].filter(Boolean),
        },
      },
    };

    // Add user location info if provided
    if (userLatitude && userLongitude) {
      response.user_location = {
        latitude: userLatitude,
        longitude: userLongitude,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in seller details API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch seller details",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
