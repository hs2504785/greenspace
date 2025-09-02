import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseClient();

    console.log("Initial session:", {
      id: session.user.id,
      email: session.user.email,
    });

    // First find or create user
    let userId = session.user.id;

    if (!userId) {
      // Try to find user by email
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log("Found user by email:", existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.image,
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({
              message: "Failed to create user profile",
              details: createError.message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        userId = newUser.id;
        console.log("Created new user:", newUser);
      }
    }

    console.log("Using user ID:", userId);

    // Get user profile
    console.log("Fetching user profile for ID:", userId);

    // Try to get user data, handling case where whatsapp_store_link column might not exist yet
    let user, error;
    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select(
          "id, whatsapp_number, whatsapp_store_link, location, show_email_publicly, show_phone_publicly, show_whatsapp_publicly, profile_public, updated_at"
        )
        .eq("id", userId)
        .single();
      user = data;
      error = fetchError;
    } catch (columnError) {
      console.warn(
        "Column might not exist, trying without whatsapp_store_link:",
        columnError
      );
      // Fallback: try without the new column
      const { data, error: fetchError } = await supabase
        .from("users")
        .select(
          "id, whatsapp_number, location, show_email_publicly, show_phone_publicly, show_whatsapp_publicly, profile_public, updated_at"
        )
        .eq("id", userId)
        .single();
      user = data;
      error = fetchError;
      if (!error && user) {
        user.whatsapp_store_link = null; // Add missing field
      }
    }

    console.log("Fetch result:", { user, error });

    if (error) {
      console.error("Error fetching user profile:", error);
      return new Response(
        JSON.stringify({ message: "Failed to fetch profile" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET profile:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseClient();

    console.log("Initial session:", {
      id: session.user.id,
      email: session.user.email,
    });

    // First find or create user
    let userId = session.user.id;

    if (!userId) {
      // Try to find user by email
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log("Found user by email:", existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: session.user.email,
            name: session.user.name,
            avatar_url: session.user.image,
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({
              message: "Failed to create user profile",
              details: createError.message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        userId = newUser.id;
        console.log("Created new user:", newUser);
      }
    }

    console.log("Using user ID:", userId);

    const data = await request.json();
    console.log("Received request data:", data);

    // Prepare update data object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Handle WhatsApp number update if provided
    if (data.whatsapp_number !== undefined) {
      const whatsapp_number = data.whatsapp_number;

      if (whatsapp_number && !/^[0-9]{10}$/.test(whatsapp_number)) {
        return new Response(
          JSON.stringify({
            message: "Please enter a valid 10-digit phone number",
            details: "WhatsApp number must be exactly 10 digits",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      updateData.whatsapp_number = whatsapp_number;
    }

    // Handle location update if provided
    if (data.location !== undefined) {
      const location = data.location?.trim();

      if (location && location.length > 500) {
        return new Response(
          JSON.stringify({
            message: "Location is too long",
            details: "Location must be 500 characters or less",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      updateData.location = location || null;
    }

    // Handle coordinate updates if provided
    if (data.coordinates !== undefined) {
      const { lat, lon, accuracy } = data.coordinates || {};

      if (lat !== undefined && lon !== undefined) {
        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return new Response(
            JSON.stringify({
              message: "Invalid coordinates",
              details:
                "Latitude must be between -90 and 90, longitude between -180 and 180",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        updateData.latitude = lat;
        updateData.longitude = lon;
        updateData.coordinates_updated_at = new Date().toISOString();

        if (accuracy !== undefined && accuracy > 0) {
          updateData.location_accuracy = Math.round(accuracy);
        }
      } else {
        // Clear coordinates if explicitly set to null
        updateData.latitude = null;
        updateData.longitude = null;
        updateData.location_accuracy = null;
        updateData.coordinates_updated_at = null;
      }
    }

    // Handle privacy settings if provided
    if (data.show_email_publicly !== undefined) {
      updateData.show_email_publicly = Boolean(data.show_email_publicly);
    }

    if (data.show_phone_publicly !== undefined) {
      updateData.show_phone_publicly = Boolean(data.show_phone_publicly);
    }

    if (data.show_whatsapp_publicly !== undefined) {
      updateData.show_whatsapp_publicly = Boolean(data.show_whatsapp_publicly);
    }

    if (data.profile_public !== undefined) {
      updateData.profile_public = Boolean(data.profile_public);
    }

    // Handle WhatsApp store link update if provided
    if (data.whatsapp_store_link !== undefined) {
      const whatsapp_store_link = data.whatsapp_store_link?.trim();

      if (whatsapp_store_link && whatsapp_store_link.length > 500) {
        return new Response(
          JSON.stringify({
            message: "WhatsApp store link is too long",
            details: "Store link must be 500 characters or less",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Basic URL validation
      if (
        whatsapp_store_link &&
        !whatsapp_store_link.match(/^(https?:\/\/|wa\.me\/|whatsapp:\/\/)/)
      ) {
        return new Response(
          JSON.stringify({
            message: "Invalid WhatsApp store link format",
            details:
              "Please enter a valid URL starting with http://, https://, wa.me/, or whatsapp://",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      updateData.whatsapp_store_link = whatsapp_store_link || null;
    }

    // Update the user
    console.log("Attempting to update user:", {
      userId,
      updateData,
      timestamp: new Date().toISOString(),
    });

    // First do the update
    console.log("Executing update query:", {
      table: "users",
      id: userId,
      data: updateData,
    });

    // Do the update with auth context, handling potential column errors
    let updatedData, updateError;
    try {
      const result = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .limit(1);
      updatedData = result.data;
      updateError = result.error;
    } catch (columnError) {
      console.warn(
        "Update failed, possibly due to missing column. Trying without whatsapp_store_link:",
        columnError
      );
      // Remove whatsapp_store_link from update data and try again
      const { whatsapp_store_link, ...fallbackUpdateData } = updateData;
      const result = await supabase
        .from("users")
        .update(fallbackUpdateData)
        .eq("id", userId)
        .select()
        .limit(1);
      updatedData = result.data;
      updateError = result.error;

      if (!updateError) {
        console.log("Update succeeded without whatsapp_store_link field");
      }
    }

    console.log("Update operation result:", {
      data: updatedData,
      error: updateError,
      userId,
      updateData,
    });

    // Get the first result since update returns an array
    const updatedUser = updatedData?.[0];

    console.log("Update result:", { updateError });

    // Verify the update immediately
    const { data: verifyData, error: verifyError } = await supabase
      .from("users")
      .select(
        "id, whatsapp_number, location, show_email_publicly, show_phone_publicly, show_whatsapp_publicly, profile_public, updated_at"
      )
      .eq("id", userId)
      .single();

    console.log("Immediate verification:", {
      verifyData,
      verifyError,
      updateData,
    });

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return new Response(
        JSON.stringify({
          message: "Failed to update profile",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!updatedData || !updatedUser) {
      console.error("No data returned after update:", { updatedData });
      return new Response(
        JSON.stringify({
          message: "Failed to update profile",
          details: "No data returned after update",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Profile updated successfully:", updatedUser);

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in profile update:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
