import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();

    // Check if user is superadmin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || user?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();

    // Check if user is superadmin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || user?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, phone, whatsapp_number, location } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    // Check for existing user with same email
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is what we want
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Database error while checking for existing user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          role,
          phone: phone || null,
          whatsapp_number: whatsapp_number || null,
          location: location || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating user:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // Provide more specific error messages
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      } else if (error.code === "42501") {
        return NextResponse.json(
          { error: "Database permission error. Please contact administrator." },
          { status: 500 }
        );
      } else if (error.message?.includes("row-level security")) {
        return NextResponse.json(
          {
            error:
              "Database security policy error. Please contact administrator.",
          },
          { status: 500 }
        );
      }

      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
