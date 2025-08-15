import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    // Get all mobile users
    const { data: mobileUsers, error } = await supabase
      .from("users")
      .select(
        "id, name, email, phone_number, whatsapp_number, provider, created_at"
      )
      .eq("provider", "mobile")
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch mobile users",
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get all users for comparison
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, name, email, phone_number, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        mobileUsers: mobileUsers || [],
        allUsersPreview: allUsers || [],
        stats: {
          totalMobileUsers: mobileUsers?.length || 0,
          totalUsers: allUsers?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mobile users debug error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to fetch users",
        error: error,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
