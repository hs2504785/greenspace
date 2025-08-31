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
          layout_id,
          variety,
          status,
          planting_date
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
      variety, // Will be stored in tree_positions, not trees
      category,
      season,
      years_to_fruit,
      mature_height,
      description,
      farm_id,
      position, // { layout_id, grid_x, grid_y, block_index }
      status = "healthy", // Instance status for tree_positions
    } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    // Convert empty strings to null for optional fields
    const treeData = {
      code,
      name,
      category: category || null,
      season: season || null,
      years_to_fruit: years_to_fruit || null,
      mature_height: mature_height || null,
      description: description || null,
      farm_id,
    };

    // Start transaction
    const { data: newTree, error: treeError } = await supabase
      .from("trees")
      .insert(treeData)
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
          variety: variety || null,
          status: status || "healthy",
          planting_date: new Date().toISOString().split("T")[0],
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
      category,
      season,
      years_to_fruit,
      mature_height,
      description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    // Convert empty strings to null for optional fields
    const updateData = {
      code,
      name,
      category: category || null,
      season: season || null,
      years_to_fruit: years_to_fruit || null,
      mature_height: mature_height || null,
      description: description || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("trees")
      .update(updateData)
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
