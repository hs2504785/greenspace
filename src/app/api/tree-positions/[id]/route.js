import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET single tree position with enhanced location data
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Tree position ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tree_positions")
      .select(
        `
        *,
        trees(
          id,
          code,
          name,
          description
        ),
        farm_layouts(
          id,
          name,
          description
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tree position not found" },
        { status: 404 }
      );
    }

    // Add computed location metadata
    const enhancedData = {
      ...data,
      location_type:
        data.latitude && data.longitude ? "geotagged" : "grid_only",
      location_precision: data.gps_accuracy
        ? data.gps_accuracy < 5
          ? "high"
          : data.gps_accuracy < 15
          ? "medium"
          : "low"
        : null,
      coordinates_display:
        data.latitude && data.longitude
          ? `${parseFloat(data.latitude).toFixed(6)}°N, ${parseFloat(
              data.longitude
            ).toFixed(6)}°E`
          : null,
      grid_distance_meters:
        Math.sqrt(Math.pow(data.grid_x, 2) + Math.pow(data.grid_y, 2)) * 0.3048, // 1 grid unit = 1 foot
    };

    return NextResponse.json(enhancedData);
  } catch (error) {
    console.error("Error in GET /api/tree-positions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update tree position with GPS coordinates
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Tree position ID is required" },
        { status: 400 }
      );
    }

    const {
      latitude,
      longitude,
      altitude,
      gps_accuracy,
      coordinate_source = "manual",
      // Also allow updates to other fields
      variety,
      status,
      planting_date,
      notes,
    } = body;

    // Validate GPS coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { error: "Latitude must be between -90 and 90 degrees" },
          { status: 400 }
        );
      }
      if (longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Longitude must be between -180 and 180 degrees" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData = {};

    // GPS coordinate fields
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (altitude !== undefined) updateData.altitude = altitude;
    if (gps_accuracy !== undefined) updateData.gps_accuracy = gps_accuracy;
    if (coordinate_source !== undefined)
      updateData.coordinate_source = coordinate_source;

    // Set coordinates_captured_at if GPS data is being updated
    if (latitude !== undefined || longitude !== undefined) {
      updateData.coordinates_captured_at = new Date().toISOString();
    }

    // Other fields
    if (variety !== undefined) updateData.variety = variety;
    if (status !== undefined) updateData.status = status;
    if (planting_date !== undefined) updateData.planting_date = planting_date;
    if (notes !== undefined) updateData.notes = notes;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tree_positions")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        trees(
          id,
          code,
          name,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tree position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/tree-positions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE tree position
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Tree position ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tree_positions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Tree position deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/tree-positions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
