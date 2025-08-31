import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET tree positions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");
    const treeId = searchParams.get("treeId");

    let query = supabase
      .from("tree_positions")
      .select(
        `
        *,
        trees(
          id,
          code,
          name,
          category,
          season,
          years_to_fruit,
          mature_height,
          description
        ),
        farm_layouts(
          id,
          name
        )
      `
      )
      .order("planted_at", { ascending: false });

    if (layoutId) {
      query = query.eq("layout_id", layoutId);
    }

    if (treeId) {
      query = query.eq("tree_id", treeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tree positions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/tree-positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new tree position
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      tree_id,
      layout_id,
      grid_x,
      grid_y,
      block_index = 0,
      variety,
      status = "healthy",
      planting_date,
    } = body;

    // Validate required fields
    if (
      !tree_id ||
      !layout_id ||
      grid_x === undefined ||
      grid_y === undefined
    ) {
      return NextResponse.json(
        { error: "Tree ID, layout ID, grid_x, and grid_y are required" },
        { status: 400 }
      );
    }

    // Check if position is already occupied
    const { data: existingPosition } = await supabase
      .from("tree_positions")
      .select("id")
      .eq("layout_id", layout_id)
      .eq("grid_x", grid_x)
      .eq("grid_y", grid_y)
      .eq("block_index", block_index)
      .single();

    if (existingPosition) {
      return NextResponse.json(
        { error: "Position is already occupied" },
        { status: 409 }
      );
    }

    // Note: We allow multiple instances of the same tree type in the same layout
    // The position uniqueness check above is sufficient

    const { data, error } = await supabase
      .from("tree_positions")
      .insert({
        tree_id,
        layout_id,
        grid_x,
        grid_y,
        block_index,
        variety: variety || null,
        status,
        planting_date: planting_date || new Date().toISOString().split("T")[0],
      })
      .select(
        `
        *,
        trees(
          id,
          code,
          name,
          category,
          season,
          years_to_fruit,
          mature_height,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tree-positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update tree position
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, grid_x, grid_y, block_index } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Position ID is required" },
        { status: 400 }
      );
    }

    // Get the current position to check layout_id
    const { data: currentPosition } = await supabase
      .from("tree_positions")
      .select("layout_id")
      .eq("id", id)
      .single();

    if (!currentPosition) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Check if new position is already occupied (if position is being changed)
    if (
      grid_x !== undefined ||
      grid_y !== undefined ||
      block_index !== undefined
    ) {
      const { data: existingPosition } = await supabase
        .from("tree_positions")
        .select("id")
        .eq("layout_id", currentPosition.layout_id)
        .eq("grid_x", grid_x)
        .eq("grid_y", grid_y)
        .eq("block_index", block_index || 0)
        .neq("id", id)
        .single();

      if (existingPosition) {
        return NextResponse.json(
          { error: "New position is already occupied" },
          { status: 409 }
        );
      }
    }

    const updateData = {};
    if (grid_x !== undefined) updateData.grid_x = grid_x;
    if (grid_y !== undefined) updateData.grid_y = grid_y;
    if (block_index !== undefined) updateData.block_index = block_index;

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
          category,
          season,
          years_to_fruit,
          mature_height,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/tree-positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove tree position
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Position ID is required" },
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

    return NextResponse.json({ message: "Tree position removed successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/tree-positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
