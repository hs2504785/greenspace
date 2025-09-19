import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { sendFarmVisitWhatsAppMessage } from "@/services/WhatsAppService";

// GET - Fetch farm visit requests
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const userId = searchParams.get("userId");

    let query = supabase
      .from("farm_visit_requests")
      .select(
        `
        *,
        user:users!farm_visit_requests_user_id_fkey(id, name, email, phone),
        seller:users!farm_visit_requests_seller_id_fkey(id, name, email, phone),
        availability:farm_visit_availability(*)
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters based on user role and parameters
    if (session.user.role === "buyer") {
      // Regular users can only see their own requests
      query = query.eq("user_id", session.user.id);
    } else if (session.user.role === "seller") {
      // Sellers can see requests for their farm
      query = query.eq("seller_id", session.user.id);
    } else if (
      session.user.role === "admin" ||
      session.user.role === "superadmin"
    ) {
      // Admins can see all requests, optionally filtered
      if (sellerId) {
        query = query.eq("seller_id", sellerId);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching visit requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch visit requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error) {
    console.error("Error in GET /api/farm-visits/requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new farm visit request
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const formData = await request.json();

    // Validate required fields
    const requiredFields = [
      "seller_id",
      "requested_date",
      "requested_time_start",
      "requested_time_end",
      "visitor_name",
      "visitor_phone",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if the requested time slot is available
    const { data: availability, error: availabilityError } = await supabase
      .from("farm_visit_availability")
      .select("*")
      .eq("seller_id", formData.seller_id)
      .eq("date", formData.requested_date)
      .eq("start_time", formData.requested_time_start)
      .eq("end_time", formData.requested_time_end)
      .eq("is_available", true)
      .single();

    if (availabilityError || !availability) {
      return NextResponse.json(
        { error: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Check if there's space for the requested number of visitors
    const requestedVisitors = parseInt(formData.number_of_visitors) || 1;
    if (
      availability.current_bookings + requestedVisitors >
      availability.max_visitors
    ) {
      return NextResponse.json(
        {
          error:
            "Not enough space available for the requested number of visitors",
        },
        { status: 400 }
      );
    }

    // Create the visit request
    const { data, error } = await supabase
      .from("farm_visit_requests")
      .insert({
        user_id: session.user.id,
        seller_id: formData.seller_id,
        availability_id: availability.id,
        requested_date: formData.requested_date,
        requested_time_start: formData.requested_time_start,
        requested_time_end: formData.requested_time_end,
        number_of_visitors: requestedVisitors,
        visitor_name: formData.visitor_name,
        visitor_phone: formData.visitor_phone,
        visitor_email: formData.visitor_email || session.user.email,
        purpose: formData.message_to_farmer, // Using consolidated message for purpose
        special_requirements: "", // No longer used - consolidated into message
        message_to_farmer: formData.message_to_farmer,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating visit request:", error);
      return NextResponse.json(
        { error: "Failed to create visit request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Farm visit request submitted successfully",
      request: data,
    });
  } catch (error) {
    console.error("Error in POST /api/farm-visits/requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update farm visit request (approve/reject/cancel)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const { id, status, admin_notes, rejection_reason } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Request ID and status are required" },
        { status: 400 }
      );
    }

    // Fetch the existing request to check permissions
    const { data: existingRequest, error: fetchError } = await supabase
      .from("farm_visit_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "Visit request not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canUpdate =
      session.user.role === "admin" ||
      session.user.role === "superadmin" ||
      (session.user.role === "seller" &&
        existingRequest.seller_id === session.user.id) ||
      (existingRequest.user_id === session.user.id && status === "cancelled");

    if (!canUpdate) {
      return NextResponse.json(
        { error: "You don't have permission to update this request" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      status,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (admin_notes) updateData.admin_notes = admin_notes;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;

    // Update the request
    const { data, error } = await supabase
      .from("farm_visit_requests")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        user:users!farm_visit_requests_user_id_fkey(id, name, email, phone_number, whatsapp_number),
        seller:users!farm_visit_requests_seller_id_fkey(id, name, email, phone_number, whatsapp_number)
      `
      )
      .single();

    if (error) {
      console.error("Error updating visit request:", error);
      return NextResponse.json(
        { error: "Failed to update visit request" },
        { status: 500 }
      );
    }

    // Send automatic WhatsApp message for approved/rejected requests
    if (status === "approved" || status === "rejected") {
      try {
        await sendFarmVisitWhatsAppMessage(data, status);
      } catch (whatsappError) {
        console.error("WhatsApp message failed:", whatsappError);
        // Don't fail the entire request if WhatsApp fails
      }
    }

    return NextResponse.json({
      message: "Visit request updated successfully",
      request: data,
    });
  } catch (error) {
    console.error("Error in PUT /api/farm-visits/requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
