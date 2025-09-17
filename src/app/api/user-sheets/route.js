import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Get all connected sheets for the current user
 * GET /api/user-sheets
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
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
      return NextResponse.json({
        success: true,
        sheets: [],
      });
    }

    // Get all connected sheets for this user
    const { data: connections, error } = await supabase
      .from("user_sheet_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("Error fetching user sheets:", error);
      return NextResponse.json(
        { error: "Failed to fetch connected sheets" },
        { status: 500 }
      );
    }

    // Format the response
    const sheets = connections.map((connection) => ({
      id: connection.id,
      sheet_id: connection.sheet_id,
      sheet_url: connection.sheet_url,
      name: `Sheet ${connection.sheet_id.substring(0, 8)}...`,
      connected_at: connection.connected_at,
      last_sync: connection.last_accessed,
      product_count: 0, // We'll calculate this separately if needed
    }));

    return NextResponse.json({
      success: true,
      sheets,
    });
  } catch (error) {
    console.error("Error fetching user sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected sheets" },
      { status: 500 }
    );
  }
}
