import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch custom node types for a layout
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");

    if (!layoutId) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("custom_node_types")
      .select("*")
      .eq("layout_id", layoutId);

    if (error) {
      console.error("Error fetching custom node types:", error);
      return NextResponse.json(
        { error: "Failed to fetch custom node types" },
        { status: 500 }
      );
    }

    // Convert to Map format expected by frontend
    const customNodeTypes = {};
    data.forEach((item) => {
      const key = `${item.block_index}-${item.grid_x}-${item.grid_y}`;
      customNodeTypes[key] = item.node_type;
    });

    return NextResponse.json({ customNodeTypes });
  } catch (error) {
    console.error("Error in GET /api/custom-node-types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save/Update custom node type
export async function POST(request) {
  try {
    const { layoutId, blockIndex, gridX, gridY, nodeType } =
      await request.json();

    if (
      !layoutId ||
      blockIndex === undefined ||
      gridX === undefined ||
      gridY === undefined
    ) {
      return NextResponse.json(
        {
          error: "layoutId, blockIndex, gridX, and gridY are required",
        },
        { status: 400 }
      );
    }

    // If nodeType is null, delete the custom type (revert to position-based)
    if (!nodeType) {
      const { error } = await supabase
        .from("custom_node_types")
        .delete()
        .eq("layout_id", layoutId)
        .eq("block_index", blockIndex)
        .eq("grid_x", gridX)
        .eq("grid_y", gridY);

      if (error) {
        console.error("Error deleting custom node type:", error);
        return NextResponse.json(
          { error: "Failed to delete custom node type" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "deleted" });
    }

    // Validate node type
    const validTypes = [
      "big",
      "centerBig",
      "medium",
      "small",
      "tiny",
      "default",
    ];
    if (!validTypes.includes(nodeType)) {
      return NextResponse.json(
        {
          error: `Invalid node type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Upsert custom node type
    const { data, error } = await supabase
      .from("custom_node_types")
      .upsert(
        {
          layout_id: layoutId,
          block_index: blockIndex,
          grid_x: gridX,
          grid_y: gridY,
          node_type: nodeType,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "layout_id,block_index,grid_x,grid_y",
        }
      )
      .select();

    if (error) {
      console.error("Error saving custom node type:", error);
      return NextResponse.json(
        { error: "Failed to save custom node type" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Error in POST /api/custom-node-types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom node type (revert to default)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");
    const blockIndex = searchParams.get("blockIndex");
    const gridX = searchParams.get("gridX");
    const gridY = searchParams.get("gridY");

    if (
      !layoutId ||
      blockIndex === undefined ||
      gridX === undefined ||
      gridY === undefined
    ) {
      return NextResponse.json(
        {
          error: "layoutId, blockIndex, gridX, and gridY are required",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("custom_node_types")
      .delete()
      .eq("layout_id", layoutId)
      .eq("block_index", parseInt(blockIndex))
      .eq("grid_x", parseInt(gridX))
      .eq("grid_y", parseInt(gridY));

    if (error) {
      console.error("Error deleting custom node type:", error);
      return NextResponse.json(
        { error: "Failed to delete custom node type" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/custom-node-types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
