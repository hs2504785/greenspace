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
    const formData = await request.json();

    // Create seller request
    const { data, error } = await supabase
      .from("seller_requests")
      .insert({
        user_id: session.user.id,
        business_name: formData.farm_name, // Use farm name as business name
        business_description: formData.farm_description, // Use farm description as business description
        location: formData.location,
        contact_number: formData.contact_number,
        whatsapp_number: formData.whatsapp_number,

        // Farm-specific fields
        farm_name: formData.farm_name,
        farm_description: formData.farm_description,
        farming_methods: formData.farming_methods,
        farm_size_acres: parseFloat(formData.farm_size_acres) || null,
        years_farming: parseInt(formData.years_farming) || null,
        certifications: formData.certifications || [],

        // Growing practices
        growing_practices: formData.growing_practices,
        soil_management: formData.soil_management,
        pest_management: formData.pest_management,
        water_source: formData.water_source,
        seasonal_calendar: formData.seasonal_calendar,

        // Farm verification
        farm_photos: formData.farm_photos || [],
        farm_visit_available: formData.farm_visit_available || false,
        farm_visit_address: formData.farm_visit_address,
        preferred_visit_times: formData.preferred_visit_times,

        // Documents
        documents: formData.documents || [],

        status: "pending",
        verification_level: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating seller request:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // If table doesn't exist, provide helpful error message
      if (
        error.code === "42P01" ||
        error.message?.includes("relation") ||
        error.message?.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Seller registration system is not set up yet. Please contact administrator.",
            code: "TABLE_NOT_EXISTS",
          },
          { status: 503 }
        );
      }

      throw error;
    }

    // Also create a basic farm profile
    if (data) {
      await supabase.from("seller_farm_profiles").upsert({
        seller_id: session.user.id,
        farm_name: formData.farm_name || formData.business_name,
        farm_story: formData.farm_description || formData.business_description,
        farm_type: "natural_farm",
        detailed_location: formData.location,
        farming_philosophy: formData.growing_practices,
        sustainability_practices: formData.pest_management,
        visit_booking_enabled: formData.farm_visit_available || false,
        visit_contact_info: formData.preferred_visit_times,
        public_profile: true,
        farm_gallery_urls: formData.farm_photos || [],
      });
    }

    return NextResponse.json({
      message: "Seller application submitted successfully",
      request: data,
    });
  } catch (error) {
    console.error("Error creating seller request:", error);
    return NextResponse.json(
      { error: "Failed to submit seller application" },
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
    const userId = searchParams.get("userId");

    let query = supabase
      .from("seller_requests")
      .select(
        `
        *,
        user:users!seller_requests_user_id_fkey(id, name, email, phone, whatsapp_number)
      `
      )
      .order("created_at", { ascending: false });

    // If userId is provided, filter by user
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      // Check if user is admin to view all requests
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userError || !["admin", "superadmin"].includes(user?.role)) {
        // Non-admin users can only see their own requests
        query = query.eq("user_id", session.user.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching seller requests:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // If table doesn't exist, return empty array instead of error
      if (
        error.code === "42P01" ||
        error.message?.includes("relation") ||
        error.message?.includes("does not exist")
      ) {
        console.warn(
          "⚠️ seller_requests table doesn't exist yet, returning empty array"
        );
        return NextResponse.json([]);
      }

      throw error;
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
