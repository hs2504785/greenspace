/**
 * API Route: /api/nearby-sellers
 * Handles fetching nearby sellers based on user location
 */

import { NextResponse } from "next/server";
import LocationService from "../../../services/LocationService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude"));
    const longitude = parseFloat(searchParams.get("longitude"));
    const radius = parseFloat(searchParams.get("radius")) || 50;
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    // If searching by text (city/state/address)
    if (search || city || state) {
      const searchTerm = search || city || state;
      const sellers = await LocationService.searchSellersByLocation(searchTerm);

      return NextResponse.json({
        success: true,
        data: sellers,
        total: sellers.length,
        search_term: searchTerm,
      });
    }

    // Validate coordinates for location-based search
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

    // Get nearby sellers
    const sellers = await LocationService.getNearbySellers(
      latitude,
      longitude,
      radius
    );

    return NextResponse.json({
      success: true,
      data: sellers,
      total: sellers.length,
      user_location: { latitude, longitude },
      radius: radius,
      unit: "km",
    });
  } catch (error) {
    console.error("Error in nearby-sellers API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch nearby sellers",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "geocode":
        return await handleGeocode(data);
      case "reverse_geocode":
        return await handleReverseGeocode(data);
      case "update_location":
        return await handleUpdateLocation(data);
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in nearby-sellers POST API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle geocoding address to coordinates
 */
async function handleGeocode(data) {
  const { address } = data;

  if (!address || typeof address !== "string" || address.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Address is required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await LocationService.geocodeAddress(address);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to geocode address",
        details: error.message,
      },
      { status: 400 }
    );
  }
}

/**
 * Handle reverse geocoding coordinates to address
 */
async function handleReverseGeocode(data) {
  const { latitude, longitude } = data;

  if (!LocationService.isValidCoordinates(latitude, longitude)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid coordinates",
      },
      { status: 400 }
    );
  }

  try {
    const result = await LocationService.reverseGeocode(latitude, longitude);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reverse geocode",
        details: error.message,
      },
      { status: 400 }
    );
  }
}

/**
 * Handle updating user location
 */
async function handleUpdateLocation(data) {
  const {
    userId,
    latitude,
    longitude,
    address,
    city,
    state,
    country,
    postal_code,
  } = data;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "User ID is required",
      },
      { status: 400 }
    );
  }

  if (!LocationService.isValidCoordinates(latitude, longitude)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid coordinates",
      },
      { status: 400 }
    );
  }

  try {
    const result = await LocationService.updateUserLocation(userId, {
      latitude,
      longitude,
      address,
      city,
      state,
      country: country || "India",
      postal_code,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user location",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
