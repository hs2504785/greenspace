#!/usr/bin/env node

/**
 * Rollback Invalid Image Variants Script
 *
 * This script fixes products where we incorrectly added non-existent
 * image variants to the database. It checks if the variants actually
 * exist in storage and reverts to the original single URL if they don't.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Load environment variables
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

// Check if URL exists (returns 200)
function checkUrlExists(url) {
  return new Promise((resolve) => {
    // Validate URL format first
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      console.log(`   Invalid URL format: ${url}`);
      resolve(false);
      return;
    }

    const req = https.request(url, { method: "HEAD" }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", (err) => {
      console.log(`   URL check error for ${url}: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

const env = loadEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function rollbackInvalidVariants() {
  try {
    console.log("🔍 Checking for invalid image variants...");

    // Get all products with 3 image variants
    const { data: products, error } = await supabase
      .from("vegetables")
      .select("id, name, images");

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const productsWithThreeVariants = products.filter(
      (p) => p.images && p.images.length === 3
    );

    console.log(
      `📋 Found ${productsWithThreeVariants.length} products with 3 variants`
    );

    const invalidProducts = [];

    // Check each product's variants
    for (const product of productsWithThreeVariants) {
      console.log(`🔍 Checking "${product.name}"...`);

      const [thumbnailUrl, mediumUrl, largeUrl] = product.images;

      // Check if all variants exist
      const [thumbnailExists, mediumExists, largeExists] = await Promise.all([
        checkUrlExists(thumbnailUrl),
        checkUrlExists(mediumUrl),
        checkUrlExists(largeUrl),
      ]);

      console.log(`   Thumbnail: ${thumbnailExists ? "✅" : "❌"}`);
      console.log(`   Medium: ${mediumExists ? "✅" : "❌"}`);
      console.log(`   Large: ${largeExists ? "✅" : "❌"}`);

      if (!thumbnailExists || !mediumExists || !largeExists) {
        invalidProducts.push({
          ...product,
          mediumUrl,
          variantsExist: { thumbnailExists, mediumExists, largeExists },
        });
      }
    }

    if (invalidProducts.length === 0) {
      console.log("✅ All image variants are valid!");
      return;
    }

    console.log(
      `\n⚠️  Found ${invalidProducts.length} products with invalid variants:`
    );
    invalidProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.id})`);
    });

    // Rollback invalid products
    console.log("\n🔧 Rolling back to single medium URL...");

    for (const product of invalidProducts) {
      console.log(`   Fixing "${product.name}"...`);

      const { error: updateError } = await supabase
        .from("vegetables")
        .update({
          images: [product.mediumUrl],
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(
          `   ❌ Failed to update ${product.name}:`,
          updateError.message
        );
      } else {
        console.log(`   ✅ Reverted ${product.name} to single URL`);
      }
    }

    console.log("\n🎉 Rollback completed!");
    console.log("   Invalid variants have been reverted to single URLs");
    console.log("   App will now use fallback images gracefully");
  } catch (error) {
    console.error("\n❌ Rollback failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  rollbackInvalidVariants();
}

module.exports = { rollbackInvalidVariants };
