/**
 * Profile utility functions for updating user profile information
 */

/**
 * Updates user profile with location and contact info if they are currently empty
 * @param {string} userId - User ID
 * @param {string} location - Location from checkout form
 * @param {string} contactNumber - Contact number from checkout form
 * @returns {Promise<boolean>} - Returns true if update was successful or not needed
 */
export async function updateProfileIfEmpty(userId, location, contactNumber) {
  try {
    if (!userId || (!location && !contactNumber)) {
      console.log("❌ No userId or no data to update profile");
      return false;
    }

    console.log("🔄 Checking if profile needs updating for user:", userId);

    // First, get current user profile to check if fields are empty
    const profileResponse = await fetch(`/api/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      console.error("❌ Failed to fetch user profile for update check");
      return false;
    }

    const { user: currentProfile } = await profileResponse.json();

    // Prepare update data only for empty fields
    const updateData = {};

    if (!currentProfile.location && location && location.trim()) {
      updateData.location = location.trim();
      console.log("📍 Will update location:", updateData.location);
    }

    if (
      !currentProfile.whatsapp_number &&
      contactNumber &&
      contactNumber.trim()
    ) {
      updateData.whatsapp_number = contactNumber.trim();
      console.log("📞 Will update contact number:", updateData.whatsapp_number);
    }

    // If no updates needed, return success
    if (Object.keys(updateData).length === 0) {
      console.log(
        "✅ Profile already has location and contact info, no update needed"
      );
      return true;
    }

    console.log("🔄 Updating profile with:", updateData);

    // Update the profile
    const updateResponse = await fetch(`/api/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      console.error(
        "❌ Failed to update user profile:",
        await updateResponse.text()
      );
      return false;
    }

    const updateResult = await updateResponse.json();
    console.log("✅ Profile updated successfully:", updateResult);
    return true;
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return false;
  }
}
