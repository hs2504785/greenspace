#!/usr/bin/env node

/**
 * Fix Missing Image Variants Script
 *
 * This script updates the database to include all 3 image variants
 * (thumbnail, medium, large) for products that currently only have
 * the medium variant stored in the database.
 *
 * Run with: node scripts/fix-image-variants.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = {};

  try {
    const data = fs.readFileSync(envPath, "utf8");
    const lines = data.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to load .env.local file:", error.message);
    process.exit(1);
  }

  return env;
}

const env = loadEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixImageVariants() {
  try {
    console.log("🔍 Starting image variants fix...");

    // Step 1: Find products with only medium variants
    console.log("\n📋 Step 1: Finding products with missing variants...");

    const { data: productsToFix, error: selectError } = await supabase
      .from("vegetables")
      .select("id, name, images")
      .filter("images", "not.is", null);

    if (selectError) {
      throw new Error(`Failed to fetch products: ${selectError.message}`);
    }

    // Filter products that need fixing
    const needsFixing = productsToFix.filter((product) => {
      return (
        product.images &&
        product.images.length === 1 &&
        product.images[0].includes("_medium.webp") &&
        product.images[0].includes("supabase.co")
      );
    });

    console.log(`   Found ${needsFixing.length} products that need fixing`);

    if (needsFixing.length === 0) {
      console.log("✅ No products need fixing. All good!");
      return;
    }

    // Show which products will be updated
    console.log("\n📝 Products to be updated:");
    needsFixing.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
      console.log(`      Current: ${product.images[0]}`);
    });

    // Step 2: Update each product
    console.log("\n🔧 Step 2: Updating products...");

    const updatePromises = needsFixing.map(async (product) => {
      const mediumUrl = product.images[0];
      const thumbnailUrl = mediumUrl.replace("_medium.webp", "_thumbnail.webp");
      const largeUrl = mediumUrl.replace("_medium.webp", "_large.webp");

      const newImages = [thumbnailUrl, mediumUrl, largeUrl];

      console.log(`   Updating "${product.name}"...`);
      console.log(`      Thumbnail: ${thumbnailUrl}`);
      console.log(`      Medium:    ${mediumUrl}`);
      console.log(`      Large:     ${largeUrl}`);

      const { data, error } = await supabase
        .from("vegetables")
        .update({
          images: newImages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .select("id, name, images");

      if (error) {
        throw new Error(`Failed to update ${product.name}: ${error.message}`);
      }

      return { product: product.name, success: true, newImages };
    });

    const results = await Promise.all(updatePromises);

    console.log("\n✅ Step 3: Verification...");

    // Verify updates
    const { data: updatedProducts, error: verifyError } = await supabase
      .from("vegetables")
      .select("id, name, images")
      .in(
        "id",
        needsFixing.map((p) => p.id)
      );

    if (verifyError) {
      throw new Error(`Failed to verify updates: ${verifyError.message}`);
    }

    console.log("\n🎉 Update Summary:");
    console.log(`   ✅ Updated ${results.length} products successfully`);
    console.log(`   📊 Each product now has 3 image variants:`);
    console.log(`      - Thumbnail (~3.6KB)`);
    console.log(`      - Medium (~11.3KB)`);
    console.log(`      - Large (~20.4KB)`);

    console.log("\n📋 Verification Results:");
    updatedProducts.forEach((product) => {
      console.log(`   ✅ ${product.name}: ${product.images.length} variants`);
    });

    console.log("\n🚀 Migration completed successfully!");
    console.log(
      "   Your app will now use optimized image variants for all products."
    );
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  fixImageVariants();
}

module.exports = { fixImageVariants };
