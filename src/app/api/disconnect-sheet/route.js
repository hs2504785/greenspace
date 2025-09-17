import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Disconnect a sheet from the user's account
 * POST /api/disconnect-sheet
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    const { sheetId } = await request.json();
    if (!sheetId) {
      return NextResponse.json(
        { error: "Sheet ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Disconnect the sheet (mark as inactive)
    const { error } = await supabase
      .from("user_sheet_connections")
      .update({
        is_active: false,
        disconnected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("sheet_id", sheetId);

    if (error) {
      console.error("Error disconnecting sheet:", error);
      return NextResponse.json(
        { error: "Failed to disconnect sheet" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sheet disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting sheet:", error);
    return NextResponse.json(
      { error: "Failed to disconnect sheet" },
      { status: 500 }
    );
  }
}
