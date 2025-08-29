import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET tree care logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get("treeId");
    const limit = searchParams.get("limit");

    let query = supabase
      .from("tree_care_logs")
      .select(
        `
        *,
        trees(
          id,
          code,
          name
        )
      `
      )
      .order("performed_at", { ascending: false });

    if (treeId) {
      query = query.eq("tree_id", treeId);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tree care logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/tree-care-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new care log
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      tree_id,
      activity_type,
      description,
      notes,
      performed_by,
      images = [],
    } = body;

    // Validate required fields
    if (!tree_id || !activity_type || !description) {
      return NextResponse.json(
        { error: "Tree ID, activity type, and description are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tree_care_logs")
      .insert({
        tree_id,
        activity_type,
        description,
        notes,
        performed_by,
        images,
        performed_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        trees(
          id,
          code,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating tree care log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tree-care-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update care log
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, activity_type, description, notes, images } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Care log ID is required" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (activity_type !== undefined) updateData.activity_type = activity_type;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (images !== undefined) updateData.images = images;

    const { data, error } = await supabase
      .from("tree_care_logs")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        trees(
          id,
          code,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating tree care log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/tree-care-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete care log
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Care log ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tree_care_logs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting tree care log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Care log deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/tree-care-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

