import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

/**
 * Simple database connectivity test API
 * Tests basic access to core tables
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const supabase = createSupabaseClient();
    const results = {
      authentication: session
        ? {
            status: "authenticated",
            user: {
              id: session.user.id,
              role: session.user.role,
              email: session.user.email,
            },
          }
        : {
            status: "not_authenticated",
          },
    };

    // Test 1: Users table (should exist)
    try {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      results.users = usersError
        ? { status: "error", message: usersError.message }
        : { status: "success", count: users?.length || 0 };
    } catch (err) {
      results.users = { status: "error", message: err.message };
    }

    // Test 2: Farm visit availability table
    try {
      const { data: availability, error: availabilityError } = await supabase
        .from("farm_visit_availability")
        .select("id")
        .limit(1);

      results.farm_visit_availability = availabilityError
        ? { status: "error", message: availabilityError.message }
        : { status: "success", count: availability?.length || 0 };
    } catch (err) {
      results.farm_visit_availability = {
        status: "error",
        message: err.message,
      };
    }

    // Test 3: Farm visit requests table
    try {
      const { data: requests, error: requestsError } = await supabase
        .from("farm_visit_requests")
        .select("id")
        .limit(1);

      results.farm_visit_requests = requestsError
        ? { status: "error", message: requestsError.message }
        : { status: "success", count: requests?.length || 0 };
    } catch (err) {
      results.farm_visit_requests = { status: "error", message: err.message };
    }

    // Test 4: Seller farm profiles table
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("seller_farm_profiles")
        .select("id")
        .limit(1);

      results.seller_farm_profiles = profilesError
        ? { status: "error", message: profilesError.message }
        : { status: "success", count: profiles?.length || 0 };
    } catch (err) {
      results.seller_farm_profiles = { status: "error", message: err.message };
    }

    return NextResponse.json({
      message: "Database connectivity test completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        error: "Database test failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
