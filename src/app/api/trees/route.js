import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all trees
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const layoutId = searchParams.get("layoutId");

    let query = supabase
      .from("trees")
      .select(
        `
        *,
        tree_positions(
          id,
          grid_x,
          grid_y,
          block_index,
          planted_at,
          layout_id
        )
      `
      )
      .order("created_at", { ascending: false });

    if (farmId) {
      query = query.eq("farm_id", farmId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching trees:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by layoutId if provided (at position level)
    let filteredData = data;
    if (layoutId) {
      filteredData = data.filter((tree) =>
        tree.tree_positions.some((pos) => pos.layout_id === layoutId)
      );
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error in GET /api/trees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new tree
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      scientific_name,
      variety,
      description,
      planting_date,
      expected_harvest_date,
      status = "healthy",
      farm_id,
      position, // { layout_id, grid_x, grid_y, block_index }
    } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    // Start transaction
    const { data: newTree, error: treeError } = await supabase
      .from("trees")
      .insert({
        code,
        name,
        scientific_name,
        variety,
        description,
        planting_date,
        expected_harvest_date,
        status,
        farm_id,
      })
      .select()
      .single();

    if (treeError) {
      console.error("Error creating tree:", treeError);
      return NextResponse.json({ error: treeError.message }, { status: 500 });
    }

    // Add position if provided
    if (position && newTree) {
      const { error: positionError } = await supabase
        .from("tree_positions")
        .insert({
          tree_id: newTree.id,
          layout_id: position.layout_id,
          grid_x: position.grid_x,
          grid_y: position.grid_y,
          block_index: position.block_index || 0,
        });

      if (positionError) {
        console.error("Error creating tree position:", positionError);
        // Don't fail the whole operation, position can be added later
      }
    }

    return NextResponse.json(newTree, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/trees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update tree
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      code,
      name,
      scientific_name,
      variety,
      description,
      planting_date,
      expected_harvest_date,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("trees")
      .update({
        code,
        name,
        scientific_name,
        variety,
        description,
        planting_date,
        expected_harvest_date,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tree:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/trees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tree
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("trees").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tree:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Tree deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/trees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

