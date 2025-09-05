import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    console.log("🔍 AI Wishlist Get:", { userId });

    const { data: wishlist, error } = await supabase
      .from("user_wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      wishlist: wishlist || [],
      count: wishlist?.length || 0,
    });
  } catch (error) {
    console.error("❌ Wishlist get error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not get wishlist. Please try again.",
        wishlist: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, action, itemName, maxPrice, preferredLocation } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    console.log("🔍 AI Wishlist Action:", { userId, action, itemName });

    if (action === "add") {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("user_wishlist")
        .select("id")
        .eq("user_id", userId)
        .eq("item_name", itemName)
        .single();

      if (existing) {
        return NextResponse.json({
          success: false,
          error: `${itemName} is already in your wishlist`,
        });
      }

      // Add new wishlist item
      const { data: newItem, error } = await supabase
        .from("user_wishlist")
        .insert({
          user_id: userId,
          item_name: itemName,
          max_price: maxPrice,
          preferred_location: preferredLocation,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: `✅ Added ${itemName} to your wishlist`,
        item: newItem,
      });
    } else if (action === "remove") {
      const { error } = await supabase
        .from("user_wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("item_name", itemName);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: `✅ Removed ${itemName} from your wishlist`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Wishlist action error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not update wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}
