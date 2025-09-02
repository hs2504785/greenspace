import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request) {
  try {
    const supabase = createSupabaseClient();

    // Get all users with available fields including coordinates
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, name, email, created_at, location, avatar_url, whatsapp_store_link, latitude, longitude, location_accuracy, coordinates_updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get product counts for all users
    const { data: productCounts, error: countError } = await supabase
      .from("vegetables")
      .select("owner_id")
      .eq("available", true);

    if (countError) {
      console.warn("Error fetching product counts:", countError);
    }

    // Create a map of user ID to product count
    const productCountMap = {};
    if (productCounts) {
      productCounts.forEach((product) => {
        productCountMap[product.owner_id] =
          (productCountMap[product.owner_id] || 0) + 1;
      });
    }

    // Get seller farm profiles for additional seller information
    const { data: farmProfiles, error: farmError } = await supabase
      .from("seller_farm_profiles")
      .select("seller_id, farm_name, average_rating, total_orders");

    if (farmError) {
      console.warn("Error fetching farm profiles:", farmError);
    }

    // Create a map of seller ID to farm profile
    const farmProfileMap = {};
    if (farmProfiles) {
      farmProfiles.forEach((profile) => {
        farmProfileMap[profile.seller_id] = profile;
      });
    }

    // Filter out users without names (incomplete profiles)
    const publicUsers = data.filter((user) => {
      const hasName = user.name && user.name.trim();
      return hasName;
    });

    // Enhance users with seller information and location data
    const enhancedUsers = publicUsers.map((user) => {
      const productCount = productCountMap[user.id] || 0;
      const farmProfile = farmProfileMap[user.id];
      const isSeller = productCount > 0; // Consider someone a seller if they have products

      // Determine location type and precision
      const hasCoordinates = user.latitude !== null && user.longitude !== null;
      const locationPrecision = user.location_accuracy
        ? user.location_accuracy < 50
          ? "high"
          : user.location_accuracy < 200
          ? "medium"
          : "low"
        : null;

      const enhancedUser = {
        ...user,
        is_seller: isSeller,
        product_count: productCount,
        farm_name: farmProfile?.farm_name,
        average_rating: farmProfile?.average_rating,
        total_orders: farmProfile?.total_orders || 0,
        // Location metadata for distance calculations
        has_coordinates: hasCoordinates,
        location_type: hasCoordinates
          ? "coordinates"
          : user.location
          ? "text_only"
          : "none",
        location_precision: locationPrecision,
        // Include coordinates for distance calculations (if available)
        coordinates: hasCoordinates
          ? {
              lat: parseFloat(user.latitude),
              lon: parseFloat(user.longitude),
            }
          : null,
      };

      // Debug logging for first seller
      if (isSeller && productCount > 0) {
        console.log("🔍 DEBUG - API Seller Data:", {
          name: user.name,
          hasCoordinates,
          latitude: user.latitude,
          longitude: user.longitude,
          coordinates: enhancedUser.coordinates,
          location: user.location,
          location_type: enhancedUser.location_type,
        });
      }

      return enhancedUser;
    });

    return NextResponse.json(enhancedUsers);
  } catch (error) {
    console.error("Error fetching public users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
