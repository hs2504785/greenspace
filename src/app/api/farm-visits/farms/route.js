import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

// GET - Fetch farms/sellers that accept visits
export async function GET(request) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    const location = searchParams.get("location");
    const hasAvailability = searchParams.get("hasAvailability") === "true";
    const visitType = searchParams.get("visitType"); // farm, garden

    // Get sellers with farm profiles
    let query = supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        phone,
        location,
        role,
        seller_farm_profiles (
          id,
          farm_name,
          farm_story,
          farm_type,
          detailed_location,
          farming_philosophy,
          sustainability_practices,
          visit_booking_enabled,
          garden_visit_enabled,
          garden_type,
          garden_size_sqft,
          garden_specialties,
          growing_methods,
          garden_features,
          visit_contact_info,
          public_profile,
          farm_gallery_urls,
          profile_verified
        )
      `
      )
      .in("role", ["seller", "admin", "superadmin"])
      .eq("seller_farm_profiles.public_profile", true);

    // Filter based on visit type preference
    if (visitType) {
      if (visitType === "farm") {
        query = query.eq("seller_farm_profiles.visit_booking_enabled", true);
      } else if (visitType === "garden") {
        query = query.eq("seller_farm_profiles.garden_visit_enabled", true);
      }
    } else {
      // Show both if no specific type requested
      query = query.or(
        "seller_farm_profiles.visit_booking_enabled.eq.true,seller_farm_profiles.garden_visit_enabled.eq.true"
      );
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    const { data: sellers, error } = await query;

    if (error) {
      console.error("Error fetching farms:", error);
      return NextResponse.json(
        { error: "Failed to fetch farms" },
        { status: 500 }
      );
    }

    let farmsData = sellers || [];

    // If hasAvailability is true, filter sellers who have future availability
    if (hasAvailability) {
      const today = new Date().toISOString().split("T")[0];

      let availabilityQuery = supabase
        .from("farm_visit_availability")
        .select("seller_id")
        .eq("is_available", true)
        .gte("date", today)
        .lt("current_bookings", "max_visitors");

      // Filter by visit type if specified
      if (visitType) {
        availabilityQuery = availabilityQuery.eq("visit_type", visitType);
      }

      const { data: availabilityData, error: availabilityError } =
        await availabilityQuery;

      if (!availabilityError && availabilityData) {
        const sellersWithAvailability = availabilityData.map(
          (item) => item.seller_id
        );
        farmsData = farmsData.filter((farm) =>
          sellersWithAvailability.includes(farm.id)
        );
      }
    }

    // Add availability count for each farm
    const farmIds = farmsData.map((farm) => farm.id);
    if (farmIds.length > 0) {
      const today = new Date().toISOString().split("T")[0];

      let countQuery = supabase
        .from("farm_visit_availability")
        .select("seller_id, visit_type")
        .in("seller_id", farmIds)
        .eq("is_available", true)
        .gte("date", today)
        .lt("current_bookings", "max_visitors");

      // Apply same filters for counting
      if (visitType) {
        countQuery = countQuery.eq("visit_type", visitType);
      }

      const { data: availabilityCounts, error: countError } = await countQuery;

      if (!countError && availabilityCounts) {
        const countMap = {};
        availabilityCounts.forEach((item) => {
          countMap[item.seller_id] = (countMap[item.seller_id] || 0) + 1;
        });

        farmsData = farmsData.map((farm) => {
          const farmAvailability = availabilityCounts.filter(
            (item) => item.seller_id === farm.id
          );
          const visitTypes = [
            ...new Set(farmAvailability.map((item) => item.visit_type)),
          ];

          return {
            ...farm,
            available_slots_count: countMap[farm.id] || 0,
            available_visit_types: visitTypes,
          };
        });
      }
    }

    return NextResponse.json({ farms: farmsData });
  } catch (error) {
    console.error("Error in GET /api/farm-visits/farms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET individual farm details
export async function POST(request) {
  try {
    const { farmId } = await request.json();

    if (!farmId) {
      return NextResponse.json(
        { error: "Farm ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get detailed farm information
    const { data: farm, error: farmError } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        phone,
        location,
        role,
        seller_farm_profiles (
          id,
          farm_name,
          farm_story,
          farm_type,
          detailed_location,
          farming_philosophy,
          sustainability_practices,
          visit_booking_enabled,
          garden_visit_enabled,
          garden_type,
          garden_size_sqft,
          garden_specialties,
          growing_methods,
          garden_features,
          visit_contact_info,
          public_profile,
          farm_gallery_urls,
          profile_verified
        ),
        seller_verification_badges (
          id,
          badge_type,
          badge_name,
          badge_description,
          active
        )
      `
      )
      .eq("id", farmId)
      .in("role", ["seller", "admin", "superadmin"])
      .single();

    if (farmError || !farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    // Get upcoming availability for this farm
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: availability, error: availabilityError } = await supabase
      .from("farm_visit_availability")
      .select("*")
      .eq("seller_id", farmId)
      .eq("is_available", true)
      .gte("date", today)
      .lte("date", thirtyDaysLater)
      .lt("current_bookings", "max_visitors")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (availabilityError) {
      console.error("Error fetching availability:", availabilityError);
    }

    // Get recent reviews/visits (if reviews table exists)
    const { data: reviews, error: reviewsError } = await supabase
      .from("farm_visit_reviews")
      .select(
        `
        id,
        rating,
        review_text,
        visit_highlights,
        created_at,
        user:users!farm_visit_reviews_user_id_fkey(name)
      `
      )
      .eq("seller_id", farmId)
      .order("created_at", { ascending: false })
      .limit(10);

    const farmDetails = {
      ...farm,
      availability: availability || [],
      reviews: reviews || [],
    };

    return NextResponse.json({ farm: farmDetails });
  } catch (error) {
    console.error("Error in POST /api/farm-visits/farms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
