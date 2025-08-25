import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function PATCH(request, { params }) {
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

    const { id } = params;
    const { status, review_notes, approved } = await request.json();

    // Update the seller request
    const { data: updatedRequest, error } = await supabase
      .from("seller_requests")
      .update({
        status,
        verification_level: status,
        review_notes,
        reviewed_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("user_id")
      .single();

    if (error) throw error;

    // If approved, update user role to seller and perform additional setup
    if (approved && updatedRequest) {
      // Update user role to seller
      await supabase
        .from("users")
        .update({ role: "seller" })
        .eq("id", updatedRequest.user_id);

      // Award initial verification badge if appropriate
      if (["basic_verified", "farm_verified"].includes(status)) {
        const badgeType =
          status === "farm_verified" ? "farm_visited" : "verified_natural";
        const badgeName =
          status === "farm_verified"
            ? "Farm Verified"
            : "Verified Natural Farmer";

        await supabase.from("seller_verification_badges").insert({
          seller_id: updatedRequest.user_id,
          badge_type: badgeType,
          badge_name: badgeName,
          badge_description: `Awarded upon ${status.replace(
            "_",
            " "
          )} verification`,
          verified_by: session.user.id,
          verification_notes:
            review_notes ||
            `Automatically awarded upon ${status.replace("_", " ")} approval`,
        });
      }

      // Update farm profile if exists
      await supabase
        .from("seller_farm_profiles")
        .update({
          profile_verified: true,
          last_verification_date: new Date().toISOString(),
          verification_notes: review_notes,
        })
        .eq("seller_id", updatedRequest.user_id);
    }

    return NextResponse.json({
      message: approved
        ? "Seller application approved successfully"
        : "Seller application rejected",
      status: status,
    });
  } catch (error) {
    console.error("Error reviewing seller request:", error);
    return NextResponse.json(
      { error: "Failed to review seller request" },
      { status: 500 }
    );
  }
}
