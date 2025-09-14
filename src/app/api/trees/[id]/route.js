import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Helper function to get variety-specific descriptions
function getVarietyDescription(treeName, variety, baseDescription) {
  const varietyDescriptions = {
    mango: {
      alphanso:
        "Alphonso mango, known as the 'King of Mangoes', is prized for its rich, creamy texture and distinctive sweet flavor with hints of citrus. This premium variety from Maharashtra has thin skin, minimal fiber, and an intense aromatic fragrance. Alphonso mangoes are considered among the finest mangoes in the world, perfect for eating fresh or making premium desserts and beverages.",
      kesar:
        "Kesar mango, the 'Queen of Mangoes', is famous for its bright saffron-colored flesh and sweet, aromatic flavor. Originating from Gujarat, this variety has a unique taste profile with hints of spice and a smooth, non-fibrous texture. Kesar mangoes are excellent for fresh consumption and are highly valued for their consistent quality and extended shelf life.",
      totapuri:
        "Totapuri mango is a large, oval-shaped variety with a distinctive beak-like tip. Known for its firm texture and mildly sweet taste, it's excellent for both raw and ripe consumption. This variety is particularly popular in South India and is ideal for making pickles, chutneys, and traditional dishes when raw, and refreshing drinks when ripe.",
      dasheri:
        "Dasheri mango is a North Indian variety known for its elongated shape and sweet, aromatic flavor. The flesh is smooth, fiber-free, and has a rich taste with a pleasant fragrance. Originally from Uttar Pradesh, Dasheri mangoes are perfect for fresh eating and are considered one of the finest varieties for their consistent sweetness and quality.",
    },
    guava: {
      allahabad:
        "Allahabad Safeda guava is a premium variety known for its large size, white flesh, and exceptional sweetness. This variety has fewer seeds, crisp texture, and high vitamin C content. It's excellent for fresh consumption and processing into juices and jams.",
      apple:
        "Apple guava is characterized by its round shape, crisp texture, and sweet flavor reminiscent of apples. This variety has white to pink flesh, is rich in vitamin C, and has a pleasant aroma. It's perfect for fresh eating and making preserves.",
      pink: "Pink guava variety is known for its beautiful pink-colored flesh and sweet, aromatic flavor. It has a soft texture, high nutritional value, and is excellent for fresh consumption, smoothies, and desserts.",
    },
    lemon: {
      kagzi:
        "Kagzi lime is a thin-skinned variety known for its high juice content and strong acidic flavor. This variety is excellent for culinary use, beverages, and has good storage qualities.",
      sweet:
        "Sweet lime is a mild, less acidic variety perfect for fresh consumption. It has a sweet taste, high juice content, and is rich in vitamin C, making it ideal for health drinks and fresh eating.",
    },
  };

  const treeKey = treeName?.toLowerCase();
  const varietyKey = variety?.toLowerCase();

  if (
    varietyDescriptions[treeKey] &&
    varietyDescriptions[treeKey][varietyKey]
  ) {
    return varietyDescriptions[treeKey][varietyKey];
  }

  // Fallback to base description with variety mention
  return variety
    ? `${variety} variety of ${treeName}. ${
        baseDescription ||
        "A premium variety known for its unique characteristics and quality."
      }`
    : baseDescription;
}

// GET single tree by ID or tree position ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const isPosition = searchParams.get("position") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    let tree, error;

    if (isPosition) {
      // Fetch tree position with tree data (for specific varieties like Alphanso, Kesar)
      const { data: positionData, error: posError } = await supabase
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
        .eq("id", id)
        .single();

      if (posError) {
        error = posError;
      } else if (positionData) {
        // Merge tree position data with tree data, prioritizing variety-specific info
        tree = {
          ...positionData.trees,
          // Override with variety-specific data
          name: positionData.variety || positionData.trees.name,
          base_tree_name: positionData.trees.name, // Preserve original tree name
          variety: positionData.variety,
          status: positionData.status,
          planting_date: positionData.planting_date,
          notes: positionData.notes,
          // Add position-specific data
          tree_positions: [positionData],
          // Add variety-specific description if available
          description: positionData.variety
            ? getVarietyDescription(
                positionData.trees.name,
                positionData.variety,
                positionData.trees.description
              )
            : positionData.trees.description,
        };
      }
    } else {
      // Fetch generic tree with all related positions
      const { data: treeData, error: treeError } = await supabase
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
            planting_date,
            notes,
            updated_at,
            latitude,
            longitude,
            farm_layouts(
              id,
              name
            )
          )
        `
        )
        .eq("id", id)
        .single();

      tree = treeData;
      error = treeError;
    }

    if (error) {
      console.error("Error fetching tree:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tree not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tree) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    return NextResponse.json(tree);
  } catch (error) {
    console.error("Error in GET /api/trees/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update tree
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
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
    console.error("Error in PUT /api/trees/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tree
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    // First delete all tree positions
    const { error: positionsError } = await supabase
      .from("tree_positions")
      .delete()
      .eq("tree_id", id);

    if (positionsError) {
      console.error("Error deleting tree positions:", positionsError);
      return NextResponse.json(
        { error: positionsError.message },
        { status: 500 }
      );
    }

    // Then delete the tree
    const { error } = await supabase.from("trees").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tree:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Tree deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/trees/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
