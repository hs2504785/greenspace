import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return a mock count since we don't have a notifications table yet
    // In the future, this would query the notifications table for unread notifications

    // Mock implementation - you can replace this with actual database query
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("read", false);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = table doesn't exist
      console.error("Error fetching unread notifications:", error);
      // Return 0 for now if table doesn't exist
      return NextResponse.json({ count: 0 });
    }

    const count = notifications ? notifications.length : 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in unread-count API:", error);
    return NextResponse.json({ count: 0 });
  }
}
