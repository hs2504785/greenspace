import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Admin seller requests API called by:", session.user.email);

    const supabase = createSupabaseClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    console.log("👤 User role check:", { user, userError });

    if (userError || !["admin", "superadmin"].includes(user?.role)) {
      console.log("❌ Access denied - not admin/superadmin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || 50;

    console.log("🔍 Query parameters:", { status, limit });

    // First, let's try a simple query without joins to see if we can get basic data
    let query = supabase
      .from("seller_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    console.log("📡 Executing seller requests query...");

    const { data, error } = await query;

    console.log("📊 Query result:", {
      dataCount: data?.length || 0,
      error: error?.message || null,
      errorCode: error?.code || null,
    });

    if (error) {
      console.error("❌ Query error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // If table doesn't exist, return empty array
      if (
        error.code === "42P01" ||
        error.message?.includes("relation") ||
        error.message?.includes("does not exist")
      ) {
        console.warn(
          "⚠️ seller_requests table doesn't exist, returning empty array"
        );
        return NextResponse.json([]);
      }

      throw error;
    }

    // If we got data, let's try to enrich it with user information
    if (data && data.length > 0) {
      console.log("✅ Found seller requests, enriching with user data...");

      try {
        // Get user information for each request
        const enrichedData = await Promise.all(
          data.map(async (request) => {
            const { data: userData } = await supabase
              .from("users")
              .select("id, name, email, phone, whatsapp_number, avatar_url")
              .eq("id", request.user_id)
              .single();

            return {
              ...request,
              user: userData,
            };
          })
        );

        return NextResponse.json(enrichedData);
      } catch (enrichError) {
        console.warn(
          "⚠️ Could not enrich with user data, returning basic data:",
          enrichError
        );
        return NextResponse.json(data);
      }
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching seller requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller requests" },
      { status: 500 }
    );
  }
}
