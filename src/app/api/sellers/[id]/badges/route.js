import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("seller_verification_badges")
      .select(
        `
        *,
        verified_by_user:users!seller_verification_badges_verified_by_fkey(name)
      `
      )
      .eq("seller_id", id)
      .eq("active", true)
      .order("earned_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching seller badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller badges" },
      { status: 500 }
    );
  }
}
