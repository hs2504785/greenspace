/**
 * API Route: /api/locations
 * Handles location-related operations like popular cities and location suggestions
 */

import { NextResponse } from "next/server";
import LocationService from "../../../services/LocationService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit")) || 10;

    switch (action) {
      case "popular_cities":
        return await handlePopularCities(limit);
      case "search_suggestions":
        return await handleSearchSuggestions(searchParams.get("query"), limit);
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: popular_cities, search_suggestions",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in locations API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process location request",
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
      case "geocode_batch":
        return await handleGeocodeBatch(data);
      case "validate_coordinates":
        return await handleValidateCoordinates(data);
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
    console.error("Error in locations POST API:", error);
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
 * Handle getting popular cities with seller counts
 */
async function handlePopularCities(limit) {
  try {
    const cities = await LocationService.getPopularCities(limit);

    return NextResponse.json({
      success: true,
      data: cities,
      total: cities.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch popular cities",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle search suggestions for locations
 */
async function handleSearchSuggestions(query, limit) {
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: "Query must be at least 2 characters long",
      },
      { status: 400 }
    );
  }

  try {
    const suggestions = await LocationService.searchSellersByLocation(
      query.trim(),
      limit
    );

    // Extract unique location suggestions
    const locationSuggestions = new Set();
    suggestions.forEach((seller) => {
      if (seller.city) locationSuggestions.add(seller.city);
      if (seller.state) locationSuggestions.add(seller.state);
    });

    return NextResponse.json({
      success: true,
      data: {
        sellers: suggestions,
        location_suggestions: Array.from(locationSuggestions).slice(0, limit),
      },
      query: query.trim(),
      total_sellers: suggestions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch search suggestions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch geocoding multiple addresses
 */
async function handleGeocodeBatch(data) {
  const { addresses } = data;

  if (!Array.isArray(addresses) || addresses.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Addresses array is required",
      },
      { status: 400 }
    );
  }

  if (addresses.length > 10) {
    return NextResponse.json(
      {
        success: false,
        error: "Maximum 10 addresses allowed per batch",
      },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.allSettled(
      addresses.map(async (address, index) => {
        try {
          const result = await LocationService.geocodeAddress(address);
          return {
            index,
            address,
            success: true,
            data: result,
          };
        } catch (error) {
          return {
            index,
            address,
            success: false,
            error: error.message,
          };
        }
      })
    );

    const processedResults = results.map((result) => result.value);
    const successfulResults = processedResults.filter((r) => r.success);
    const failedResults = processedResults.filter((r) => !r.success);

    return NextResponse.json({
      success: true,
      data: {
        results: processedResults,
        successful: successfulResults.length,
        failed: failedResults.length,
        total: addresses.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process batch geocoding",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle coordinate validation
 */
async function handleValidateCoordinates(data) {
  const { coordinates } = data;

  if (!Array.isArray(coordinates)) {
    return NextResponse.json(
      {
        success: false,
        error: "Coordinates array is required",
      },
      { status: 400 }
    );
  }

  const results = coordinates.map((coord, index) => {
    const { latitude, longitude } = coord;
    const isValid = LocationService.isValidCoordinates(latitude, longitude);

    return {
      index,
      latitude,
      longitude,
      valid: isValid,
      error: isValid ? null : "Invalid coordinates",
    };
  });

  const validCount = results.filter((r) => r.valid).length;

  return NextResponse.json({
    success: true,
    data: {
      results,
      valid: validCount,
      invalid: results.length - validCount,
      total: results.length,
    },
  });
}
