import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET single tree position
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabase
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/tree-positions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update tree position
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log("PATCH /api/tree-positions/[id] - ID:", id);
    console.log("PATCH /api/tree-positions/[id] - Body:", body);

    // First check if the tree position exists
    const { data: existingPositions, error: fetchError } = await supabase
      .from("tree_positions")
      .select("id")
      .eq("id", id);

    if (fetchError) {
      console.error("Error fetching tree position:", fetchError);
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!existingPositions || existingPositions.length === 0) {
      console.error("Tree position not found for ID:", id);
      return NextResponse.json(
        { error: "Tree position not found" },
        { status: 404 }
      );
    }

    // Test if the required columns exist by trying to select them
    const { data: testColumns, error: columnError } = await supabase
      .from("tree_positions")
      .select("variety, status, planting_date, notes, updated_at")
      .eq("id", id)
      .limit(1);

    if (columnError) {
      console.error("Column check error:", columnError);
      if (
        columnError.message.includes("column") &&
        columnError.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Database migration required! The tree_positions table is missing required columns (variety, status, planting_date, notes, updated_at). Please run the migration SQL from MIGRATION_INSTRUCTIONS.md",
          },
          { status: 500 }
        );
      }
    }

    const updateData = {};

    // Only update fields that are provided
    if (body.variety !== undefined) updateData.variety = body.variety;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.planting_date !== undefined)
      updateData.planting_date = body.planting_date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    console.log("Update data:", updateData);

    // Try the update
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
      );

    console.log("Update result - data:", data);
    console.log("Update result - error:", error);

    if (error) {
      console.error("Error updating tree position:", error);

      // Check if it's a column doesn't exist error
      if (
        error.message.includes("column") &&
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Database schema needs to be updated. Please run the migration to add tree position fields.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error("No data returned after update for ID:", id);

      // Let's try to fetch the record to see if it exists
      const { data: checkData, error: checkError } = await supabase
        .from("tree_positions")
        .select("*")
        .eq("id", id);

      console.log("Check if record exists - data:", checkData);
      console.log("Check if record exists - error:", checkError);

      return NextResponse.json(
        { error: "Tree position not found after update" },
        { status: 404 }
      );
    }

    console.log("Update successful, returning data:", data[0]);
    // Return the first (and should be only) result
    return NextResponse.json(data[0]);
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

    const { data, error } = await supabase
      .from("tree_positions")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting tree position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tree position not found" },
        { status: 404 }
      );
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
