import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request) {
  try {
    const supabase = createSupabaseClient();

    // Get all users with available fields
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, name, email, created_at, location, avatar_url, whatsapp_store_link"
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

    // Enhance users with seller information
    const enhancedUsers = publicUsers.map((user) => {
      const productCount = productCountMap[user.id] || 0;
      const farmProfile = farmProfileMap[user.id];
      const isSeller = productCount > 0; // Consider someone a seller if they have products

      return {
        ...user,
        is_seller: isSeller,
        product_count: productCount,
        farm_name: farmProfile?.farm_name,
        average_rating: farmProfile?.average_rating,
        total_orders: farmProfile?.total_orders || 0,
      };
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
