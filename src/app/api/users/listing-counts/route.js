import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request) {
  try {
    const supabase = createSupabaseClient();

    // Get all users with their product counts
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .not("name", "is", null);

    if (usersError) throw usersError;

    // Get product counts for all users
    const { data: productCounts, error: countsError } = await supabase
      .from("vegetables")
      .select("owner_id")
      .eq("product_type", "regular");

    if (countsError) throw countsError;

    // Count products per user
    const countsByUser = {};
    productCounts.forEach((product) => {
      const ownerId = product.owner_id;
      countsByUser[ownerId] = (countsByUser[ownerId] || 0) + 1;
    });

    // Combine user data with counts
    const usersWithCounts = users.map((user) => ({
      id: user.id,
      name: user.name,
      productCount: countsByUser[user.id] || 0,
    }));

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error("Error fetching user listing counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing counts" },
      { status: 500 }
    );
  }
}
