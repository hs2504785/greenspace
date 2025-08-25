import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || !["admin", "superadmin"].includes(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      seller_id,
      badge_type,
      badge_name,
      badge_description,
      verification_notes,
    } = await request.json();

    // Check if badge already exists for this seller
    const { data: existingBadge } = await supabase
      .from("seller_verification_badges")
      .select("id")
      .eq("seller_id", seller_id)
      .eq("badge_type", badge_type)
      .eq("active", true)
      .single();

    if (existingBadge) {
      return NextResponse.json(
        { error: "This badge has already been awarded to this seller" },
        { status: 400 }
      );
    }

    // Award the badge
    const { data, error } = await supabase
      .from("seller_verification_badges")
      .insert({
        seller_id,
        badge_type,
        badge_name,
        badge_description,
        verified_by: session.user.id,
        verification_notes,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Update seller's trust score and verification level if appropriate
    const trustScoreBonus = getTrustScoreBonus(badge_type);

    // Update seller farm profile
    await supabase.rpc("update_seller_trust_score", {
      seller_id: seller_id,
      badge_bonus: trustScoreBonus,
    });

    // If this is a premium badge, update verification level
    if (["premium_verified", "eco_champion"].includes(badge_type)) {
      await supabase
        .from("seller_requests")
        .update({
          verification_level: "premium_verified",
          status: "premium_verified",
        })
        .eq("user_id", seller_id);
    }

    return NextResponse.json({
      message: "Badge awarded successfully",
      badge: data,
    });
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("seller_id");

    let query = supabase
      .from("seller_verification_badges")
      .select(
        `
        *,
        seller:users!seller_verification_badges_seller_id_fkey(id, name, business_name),
        verified_by_user:users!seller_verification_badges_verified_by_fkey(id, name)
      `
      )
      .eq("active", true)
      .order("earned_date", { ascending: false });

    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

function getTrustScoreBonus(badgeType) {
  const bonuses = {
    verified_natural: 15,
    community_trusted: 20,
    farm_visited: 25,
    certified_organic: 20,
    eco_champion: 25,
    premium_verified: 30,
  };

  return bonuses[badgeType] || 10;
}
