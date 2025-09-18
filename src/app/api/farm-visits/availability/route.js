import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

// GET - Fetch available time slots
export async function GET(request) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    const sellerId = searchParams.get("sellerId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const availableOnly = searchParams.get("availableOnly") === "true";

    let query = supabase
      .from("farm_visit_availability")
      .select(
        `
        *,
        seller:users!farm_visit_availability_seller_id_fkey(id, name, phone)
      `
      )
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    // Apply filters
    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    if (date) {
      query = query.eq("date", date);
    } else if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    } else {
      // Default to next 30 days if no date filters provided
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      query = query.gte("date", today).lte("date", thirtyDaysLater);
    }

    if (availableOnly) {
      query = query.eq("is_available", true);
      // Only show slots that have space
      query = query.lt("current_bookings", "max_visitors");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching availability:", error);
      return NextResponse.json(
        { error: "Failed to fetch availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ availability: data || [] });
  } catch (error) {
    console.error("Error in GET /api/farm-visits/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new availability slots
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only sellers and admins can create availability
    if (!["seller", "admin", "superadmin"].includes(session.user.role)) {
      return NextResponse.json(
        {
          error:
            "Only sellers, admins, and superadmins can create availability slots",
        },
        { status: 403 }
      );
    }

    const supabase = createSupabaseClient();
    const formData = await request.json();

    // Validate required fields
    const requiredFields = ["date", "start_time", "end_time"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // For sellers, use their own ID. For admins/superadmins, allow specifying seller_id or use their own ID
    const sellerId =
      session.user.role === "seller"
        ? session.user.id
        : formData.seller_id || session.user.id;

    const insertData = {
      seller_id: sellerId,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      is_available: formData.is_available !== false, // Default to true
      max_visitors:
        formData.max_visitors || (formData.visit_type === "garden" ? 3 : 5),
      price_per_person: formData.price_per_person || 0,
      visit_type: formData.visit_type || "farm",
      location_type: formData.location_type || "farm",
      space_description: formData.space_description,
      special_notes: formData.special_notes,
      activity_type:
        formData.activity_type ||
        (formData.visit_type === "garden" ? "garden_tour" : "farm_tour"),
    };

    const { data, error } = await supabase
      .from("farm_visit_availability")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating availability:", error);

      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A slot already exists for this date and time" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create availability slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Availability slot created successfully",
      availability: data,
    });
  } catch (error) {
    console.error("Error in POST /api/farm-visits/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update availability slot
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Availability slot ID is required" },
        { status: 400 }
      );
    }

    // Fetch the existing slot to check permissions
    const { data: existingSlot, error: fetchError } = await supabase
      .from("farm_visit_availability")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingSlot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canUpdate =
      session.user.role === "admin" ||
      session.user.role === "superadmin" ||
      (session.user.role === "seller" &&
        existingSlot.seller_id === session.user.id);

    if (!canUpdate) {
      return NextResponse.json(
        { error: "You don't have permission to update this availability slot" },
        { status: 403 }
      );
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.seller_id;
    delete updateData.current_bookings; // This is managed by triggers

    const { data, error } = await supabase
      .from("farm_visit_availability")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating availability:", error);
      return NextResponse.json(
        { error: "Failed to update availability slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Availability slot updated successfully",
      availability: data,
    });
  } catch (error) {
    console.error("Error in PUT /api/farm-visits/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove availability slot
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability slot ID is required" },
        { status: 400 }
      );
    }

    // Fetch the existing slot to check permissions
    const { data: existingSlot, error: fetchError } = await supabase
      .from("farm_visit_availability")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingSlot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete =
      session.user.role === "admin" ||
      session.user.role === "superadmin" ||
      (session.user.role === "seller" &&
        existingSlot.seller_id === session.user.id);

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this availability slot" },
        { status: 403 }
      );
    }

    // Check if there are any approved bookings for this slot
    if (existingSlot.current_bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete availability slot with active bookings" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("farm_visit_availability")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting availability:", error);
      return NextResponse.json(
        { error: "Failed to delete availability slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Availability slot deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/farm-visits/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
