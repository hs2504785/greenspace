import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request) {
  try {
    const supabase = createSupabaseClient();

    // Get all users with privacy fields
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        avatar_url,
        location,
        created_at,
        profile_public,
        whatsapp_store_link
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter out users without names (incomplete profiles) and respect privacy settings
    const publicUsers = data.filter((user) => {
      const hasName = user.name && user.name.trim();
      const isPublic = user.profile_public !== false; // Default to true if null/undefined
      return hasName && isPublic;
    });

    // Remove the profile_public field from the response since it's not needed by the client
    const cleanedUsers = publicUsers.map(({ profile_public, ...user }) => user);

    return NextResponse.json(cleanedUsers);
  } catch (error) {
    console.error("Error fetching public users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
