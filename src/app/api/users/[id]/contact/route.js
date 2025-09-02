import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseClient();

    // Get user's contact info with privacy preferences and coordinates
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        phone,
        whatsapp_number,
        whatsapp_store_link,
        location,
        avatar_url,
        created_at,
        show_email_publicly,
        show_phone_publicly,
        show_whatsapp_publicly,
        profile_public,
        latitude,
        longitude,
        location_accuracy,
        coordinates_updated_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user contact info:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if profile is public (default to true if field doesn't exist)
    if (user.profile_public === false) {
      return NextResponse.json(
        { error: "Profile not public" },
        { status: 404 }
      );
    }

    // Process coordinate data
    const hasCoordinates = user.latitude !== null && user.longitude !== null;
    const coordinates = hasCoordinates
      ? {
          lat: parseFloat(user.latitude),
          lon: parseFloat(user.longitude),
        }
      : null;

    // Build response with basic info and privacy-filtered contact details
    const contactInfo = {
      id: user.id,
      name: user.name,
      location: user.location,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      whatsapp_store_link: user.whatsapp_store_link, // Store link is always public if provided
      // Include coordinate data for map functionality
      has_coordinates: hasCoordinates,
      coordinates: coordinates,
      location_accuracy: user.location_accuracy,
      coordinates_updated_at: user.coordinates_updated_at,
    };

    // Add contact details based on privacy preferences
    if (user.show_email_publicly && user.email) {
      contactInfo.email = user.email;
    }

    if (user.show_phone_publicly && user.phone) {
      contactInfo.phone = user.phone;
    }

    if (user.show_whatsapp_publicly && user.whatsapp_number) {
      contactInfo.whatsapp_number = user.whatsapp_number;
    }

    return NextResponse.json(contactInfo);
  } catch (error) {
    console.error("Error in contact info API:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact information" },
      { status: 500 }
    );
  }
}
