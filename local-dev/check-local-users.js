#!/usr/bin/env node

/**
 * Check Local Users Script
 *
 * This script checks what users exist in your local database
 * and helps identify which ones need farm profiles
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

console.log("🔍 Checking Local Database Users...\n");

async function checkLocalUsers() {
  try {
    // Try to get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Missing Supabase credentials in .env.local");
      console.log("   Please ensure you have:");
      console.log("   - NEXT_PUBLIC_SUPABASE_URL");
      console.log(
        "   - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
      );
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check all users
    console.log("📋 All Users in Local Database:");
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role")
      .order("role", { ascending: true });

    if (usersError) {
      console.log("❌ Error fetching users:", usersError.message);
      return;
    }

    if (!allUsers || allUsers.length === 0) {
      console.log("   No users found in local database");
      return;
    }

    allUsers.forEach((user) => {
      console.log(
        `   ${user.role?.toUpperCase() || "NO_ROLE"}: ${user.name} (${
          user.email
        }) - ID: ${user.id}`
      );
    });

    // Check users with farm profiles
    console.log("\n🏪 Users with Farm Profiles:");
    const { data: profileUsers, error: profileError } = await supabase
      .from("users")
      .select(
        `
        id, name, email, role,
        seller_farm_profiles (
          id, farm_name, public_profile, visit_booking_enabled, garden_visit_enabled
        )
      `
      )
      .not("seller_farm_profiles", "is", null)
      .order("role", { ascending: true });

    if (profileError) {
      console.log("❌ Error fetching profiles:", profileError.message);
    } else if (!profileUsers || profileUsers.length === 0) {
      console.log("   No users have farm profiles yet");
    } else {
      profileUsers.forEach((user) => {
        const profile = user.seller_farm_profiles;
        const status =
          profile.public_profile && profile.visit_booking_enabled
            ? "✅ Visible"
            : "❌ Not visible";
        console.log(
          `   ${user.role?.toUpperCase()}: ${user.name} - ${
            profile.farm_name
          } ${status}`
        );
      });
    }

    // Check availability data
    console.log("\n📅 Availability Slots:");
    const { data: availability, error: availError } = await supabase
      .from("farm_visit_availability")
      .select(
        `
        id, date, start_time, end_time, is_available,
        seller:users!farm_visit_availability_seller_id_fkey(id, name, role)
      `
      )
      .order("date", { ascending: true });

    if (availError) {
      console.log("❌ Error fetching availability:", availError.message);
    } else if (!availability || availability.length === 0) {
      console.log("   No availability slots found");
    } else {
      availability.forEach((slot) => {
        const seller = slot.seller;
        console.log(
          `   ${slot.date} ${slot.start_time}-${slot.end_time}: ${seller.name} (${seller.role})`
        );
      });
    }

    // Provide recommendations
    console.log("\n💡 Recommendations:");

    const eligibleUsers = allUsers.filter((u) =>
      ["seller", "admin", "superadmin"].includes(u.role)
    );
    const usersWithProfiles = profileUsers?.map((u) => u.id) || [];
    const usersNeedingProfiles = eligibleUsers.filter(
      (u) => !usersWithProfiles.includes(u.id)
    );

    if (usersNeedingProfiles.length > 0) {
      console.log("   🔧 Users needing farm profiles:");
      usersNeedingProfiles.forEach((user) => {
        console.log(`      - ${user.name} (${user.role}) - ID: ${user.id}`);
      });
      console.log("   📝 Run: database/fix_farm_visits_all_roles_local.sql");
    } else {
      console.log("   ✅ All eligible users have farm profiles");
    }

    if (availability && availability.length > 0) {
      console.log(
        "   📅 Availability data exists - check if farms are visible on /farm-visits"
      );
    } else {
      console.log("   📅 No availability data - create some slots for testing");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

checkLocalUsers();
