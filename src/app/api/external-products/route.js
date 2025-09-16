import { NextResponse } from "next/server";
import GoogleSheetsService from "@/services/GoogleSheetsService";
import SheetsApiProtection from "@/utils/sheetsApiProtection";

// Cache for storing external products data
let cachedProducts = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";
    const validate = searchParams.get("validate") === "true";
    const spreadsheetId =
      searchParams.get("spreadsheetId") || process.env.PUBLIC_SELLERS_SHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "No spreadsheet ID configured" },
        { status: 400 }
      );
    }

    // If validation is requested, return sheet structure validation
    if (validate) {
      try {
        const validation = await GoogleSheetsService.validateSheetStructure(
          spreadsheetId
        );
        return NextResponse.json({
          success: true,
          validation,
          spreadsheetId,
        });
      } catch (error) {
        return NextResponse.json(
          { error: `Validation failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Check if we have cached data and it's still fresh
    const now = Date.now();
    const isCacheValid =
      cachedProducts && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION;

    if (!refresh && isCacheValid) {
      console.log("📋 Returning cached external products");

      // Track cache hit for monitoring
      try {
        await fetch("/api/admin/sheets-usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "increment_cache_hit" }),
        });
      } catch (trackingError) {
        console.warn("Failed to track cache hit:", trackingError);
      }

      return NextResponse.json({
        success: true,
        products: cachedProducts,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000) + " seconds",
        totalProducts: cachedProducts.length,
      });
    }

    console.log("🔄 Fetching fresh external products from Google Sheets");

    // Check API usage limits before making request
    const canMakeRequest = await SheetsApiProtection.checkUsageLimit();
    if (!canMakeRequest) {
      console.warn(
        "🚨 Sheets API usage limit reached - returning emergency fallback"
      );
      return NextResponse.json(SheetsApiProtection.getEmergencyFallbackData());
    }

    // Fetch products from Google Sheets
    const products = await GoogleSheetsService.fetchProductsFromSheet(
      spreadsheetId,
      "A:O" // Updated range to include Seller Email column
    );

    // Update cache
    cachedProducts = products;
    cacheTimestamp = now;

    console.log(`✅ Successfully fetched ${products.length} external products`);

    return NextResponse.json({
      success: true,
      products,
      cached: false,
      totalProducts: products.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in external products API:", error);

    // Return cached data if available, even if refresh failed
    if (cachedProducts && !request.url.includes("refresh=true")) {
      console.log("⚠️ Returning stale cached data due to error");
      return NextResponse.json({
        success: true,
        products: cachedProducts,
        cached: true,
        warning: "Using cached data due to fetch error",
        error: error.message,
        totalProducts: cachedProducts.length,
      });
    }

    return NextResponse.json(
      {
        error: error.message,
        success: false,
        products: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, spreadsheetId } = await request.json();

    if (action === "validate") {
      if (!spreadsheetId) {
        return NextResponse.json(
          { error: "Spreadsheet ID is required for validation" },
          { status: 400 }
        );
      }

      const validation = await GoogleSheetsService.validateSheetStructure(
        spreadsheetId
      );
      const metadata = await GoogleSheetsService.getSheetMetadata(
        spreadsheetId
      );

      return NextResponse.json({
        success: true,
        validation,
        metadata,
        spreadsheetId,
      });
    }

    if (action === "refresh_cache") {
      const targetSpreadsheetId =
        spreadsheetId || process.env.PUBLIC_SELLERS_SHEET_ID;

      if (!targetSpreadsheetId) {
        return NextResponse.json(
          { error: "No spreadsheet ID provided or configured" },
          { status: 400 }
        );
      }

      // Force refresh the cache
      const products = await GoogleSheetsService.fetchProductsFromSheet(
        targetSpreadsheetId,
        "A:O" // Updated range to include Seller Email column
      );
      cachedProducts = products;
      cacheTimestamp = Date.now();

      return NextResponse.json({
        success: true,
        message: "Cache refreshed successfully",
        totalProducts: products.length,
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: validate, refresh_cache" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error in external products POST API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
