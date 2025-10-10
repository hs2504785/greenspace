import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all farm layouts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");

    let query = supabase
      .from("farm_layouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (farmId) {
      query = query.eq("farm_id", farmId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching farm layouts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/farm-layouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new farm layout
export async function POST(request) {
  try {
    const body = await request.json();
    const { farm_id, name, description, grid_config, is_active = true } = body;

    // Validate required fields
    if (!farm_id || !name || !grid_config) {
      return NextResponse.json(
        { error: "Farm ID, name, and grid configuration are required" },
        { status: 400 }
      );
    }

    // If this layout is set to active, deactivate others for this farm
    if (is_active) {
      await supabase
        .from("farm_layouts")
        .update({ is_active: false })
        .eq("farm_id", farm_id);
    }

    const { data, error } = await supabase
      .from("farm_layouts")
      .insert({
        farm_id,
        name,
        description,
        grid_config,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating farm layout:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/farm-layouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Activate a farm layout
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { layout_id, farm_id } = body;

    // Validate required fields
    if (!layout_id || !farm_id) {
      return NextResponse.json(
        { error: "Layout ID and Farm ID are required" },
        { status: 400 }
      );
    }

    // First, deactivate all layouts for this farm
    await supabase
      .from("farm_layouts")
      .update({ is_active: false })
      .eq("farm_id", farm_id);

    // Then activate the selected layout
    const { data, error } = await supabase
      .from("farm_layouts")
      .update({ is_active: true })
      .eq("id", layout_id)
      .eq("farm_id", farm_id)
      .select()
      .single();

    if (error) {
      console.error("Error activating farm layout:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/farm-layouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update farm layout
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, grid_config, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    // If this layout is set to active, deactivate others for this farm
    if (is_active) {
      const { data: layout } = await supabase
        .from("farm_layouts")
        .select("farm_id")
        .eq("id", id)
        .single();

      if (layout) {
        await supabase
          .from("farm_layouts")
          .update({ is_active: false })
          .eq("farm_id", layout.farm_id)
          .neq("id", id);
      }
    }

    const { data, error } = await supabase
      .from("farm_layouts")
      .update({
        name,
        description,
        grid_config,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating farm layout:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/farm-layouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete farm layout
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("farm_layouts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting farm layout:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Farm layout deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/farm-layouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
