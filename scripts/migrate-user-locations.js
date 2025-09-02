/**
 * Migration script to convert existing text locations to coordinates
 * Run this after setting up geocoding API keys
 */

import { createSupabaseClient } from "../src/utils/supabaseAuth.js";
import {
  geocodeAddress,
  batchGeocodeAddresses,
} from "../src/utils/geocodingService.js";

async function migrateUserLocations() {
  console.log("🚀 Starting user location migration...");

  const supabase = createSupabaseClient();

  try {
    // Get users with text locations but no coordinates
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, location, latitude, longitude")
      .not("location", "is", null)
      .is("latitude", null);

    if (error) {
      throw error;
    }

    console.log(`📍 Found ${users.length} users with text-only locations`);

    if (users.length === 0) {
      console.log("✅ No users need location migration");
      return;
    }

    // Batch geocode addresses (5 at a time with 1 second delay)
    const geocodingResults = await batchGeocodeAddresses(
      users.map((user) => user.location),
      5, // batch size
      1000 // delay in ms
    );

    let successCount = 0;
    let failureCount = 0;

    // Update users with coordinates
    for (const { originalIndex, address, result } of geocodingResults) {
      const user = users.find((u) => u.location === address);

      if (result && user) {
        try {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              latitude: result.lat,
              longitude: result.lon,
              location_accuracy: result.accuracy,
              coordinates_updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error(
              `❌ Failed to update user ${user.name}:`,
              updateError
            );
            failureCount++;
          } else {
            console.log(
              `✅ Updated ${user.name}: ${result.lat}, ${result.lon} (±${result.accuracy}m)`
            );
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating user ${user.name}:`, error);
          failureCount++;
        }
      } else {
        console.log(
          `⚠️  Could not geocode location for ${user?.name}: "${address}"`
        );
        failureCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed to update: ${failureCount} users`);
    console.log(`📍 Total processed: ${users.length} users`);

    if (successCount > 0) {
      console.log(
        "\n🎉 Migration completed! Users with coordinates can now show precise distances."
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUserLocations();
}

export { migrateUserLocations };
