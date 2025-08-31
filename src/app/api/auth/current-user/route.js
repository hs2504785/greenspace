import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../options";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // First try to get from session
    const session = await getServerSession(authOptions);

    if (
      session?.user?.id &&
      (session.user.role === "admin" || session.user.role === "superadmin")
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          name: session.user.name,
          source: "session",
        },
      });
    }

    // Fallback: get any admin/superadmin user from database
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, role, name")
      .in("role", ["admin", "superadmin"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching admin users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admin users" },
        { status: 500 }
      );
    }

    if (users && users.length > 0) {
      return NextResponse.json({
        success: true,
        user: {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role,
          name: users[0].name,
          source: "database_fallback",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "No admin users found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
