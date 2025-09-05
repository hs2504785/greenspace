import ApiBaseService from "./ApiBaseService";
import { supabase } from "@/lib/supabase";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { imageOptimizationService } from "./ImageOptimizationService";
import ListingLimitService from "./ListingLimitService";
// import { mockVegetables } from '@/data/mockVegetables'; // Removed - no longer using mock data

class VegetableService extends ApiBaseService {
  constructor() {
    super("vegetables");
  }

  async getAllVegetables() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      // WORKAROUND: Fetch vegetables without relationship first
      const { data: vegetables, error } = await supabase
        .from(this.tableName)
        .select("*");

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new Error(error.message || "Failed to fetch vegetables");
      }

      if (!vegetables || vegetables.length === 0) {
        console.warn("No vegetables found");
        return [];
      }

      // Get unique owner IDs
      const ownerIds = [
        ...new Set(vegetables.map((v) => v.owner_id).filter(Boolean)),
      ];

      if (ownerIds.length === 0) {
        console.warn("No owner IDs found in vegetables");
        return vegetables;
      }

      // Fetch all owners in one query
      const { data: owners, error: ownerError } = await supabase
        .from("users")
        .select("id, name, email, phone, whatsapp_number, location, avatar_url")
        .in("id", ownerIds);

      if (ownerError) {
        console.warn("Could not fetch owner data:", ownerError);
        return vegetables;
      }

      // Create owner lookup map
      const ownerMap = {};
      owners?.forEach((owner) => {
        ownerMap[owner.id] = owner;
      });

      // Combine vegetables with owner data
      const vegetablesWithOwners = vegetables.map((vegetable) => ({
        ...vegetable,
        owner: ownerMap[vegetable.owner_id] || null,
      }));

      return vegetablesWithOwners;
    } catch (error) {
      console.error("Error fetching vegetables:", {
        message: error.message,
        stack: error.stack,
        fullError: error,
      });
      console.log("Returning empty array - no vegetables available");
      return [];
    }
  }

  async getVegetableById(id) {
    try {
      if (!id) {
        throw new Error("Vegetable ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      // WORKAROUND: Fetch vegetable without relationship first
      const { data: vegetable, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new Error(error.message || "Failed to fetch vegetable");
      }

      if (!vegetable) {
        throw new Error("Vegetable not found");
      }

      // Fetch owner data separately if owner_id exists
      try {
        if (vegetable.owner_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from("users")
            .select(
              "id, name, email, phone, whatsapp_number, location, avatar_url"
            )
            .eq("id", vegetable.owner_id)
            .single();

          if (!ownerError && ownerData) {
            return {
              ...vegetable,
              owner: ownerData,
            };
          }
        }

        return vegetable;
      } catch (ownerFetchError) {
        console.warn("Could not fetch owner data:", ownerFetchError);
        return vegetable;
      }
    } catch (error) {
      console.error("Error fetching vegetable:", {
        message: error.message,
        stack: error.stack,
        fullError: error,
      });
      throw error; // Re-throw error instead of returning null
    }
  }

  async getVegetablesByOwner(ownerId) {
    try {
      if (!ownerId) {
        console.warn("No ownerId provided");
        return [];
      }

      if (!supabase) throw new Error("Supabase not initialized");

      // WORKAROUND: Fetch vegetables without relationship first
      const { data: vegetables, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("owner_id", ownerId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!vegetables || vegetables.length === 0) {
        console.log("✅ No vegetables found for owner");
        return [];
      }

      // Fetch owner data separately
      try {
        const { data: ownerData, error: ownerError } = await supabase
          .from("users")
          .select(
            "id, name, email, phone, whatsapp_number, location, avatar_url"
          )
          .eq("id", ownerId)
          .single();

        // Combine data manually
        const vegetablesWithOwner = vegetables.map((vegetable) => ({
          ...vegetable,
          owner: ownerError ? null : ownerData,
        }));

        return vegetablesWithOwner;
      } catch (ownerFetchError) {
        console.warn(
          "⚠️ Could not fetch owner data, returning vegetables without owner info"
        );
        return vegetables;
      }
    } catch (error) {
      console.error("Error fetching vegetables:", error);
      return [];
    }
  }

  async createVegetable(vegetableData) {
    console.log("🚀 createVegetable called with:", vegetableData);

    try {
      console.log("✅ Step 1: Function entry");

      if (!supabase) {
        console.error("❌ Supabase not initialized");
        throw new Error("Supabase not initialized");
      }
      console.log("✅ Step 2: Supabase client available");

      // Check listing limits first
      console.log("✅ Step 2.5: Checking listing limits...");
      if (vegetableData.owner_id) {
        try {
          const validation = await ListingLimitService.validateProduct(
            vegetableData,
            vegetableData.owner_id
          );
          if (!validation.isValid) {
            console.error(
              "❌ Listing limit validation failed:",
              validation.errors
            );
            throw new Error(validation.errors.join(". "));
          }
          console.log("✅ Listing limits check passed:", validation.limitInfo);
        } catch (limitError) {
          console.error("❌ Error checking listing limits:", limitError);
          throw new Error(`Listing limit check failed: ${limitError.message}`);
        }
      }

      // Validate required fields - different for regular vs prebooking products
      console.log("🔍 Step 3: Validating required fields...");
      const isPreBookingProduct = vegetableData.product_type === "prebooking";

      let requiredFields = [
        "name",
        "price",
        "category",
        "location",
        "source_type",
        "owner_id",
      ];

      if (isPreBookingProduct) {
        // For prebooking products, quantity can be 0 and we need estimated_available_date
        requiredFields.push("estimated_available_date");
        // Remove quantity from required for prebooking products
      } else {
        // For regular products, quantity is required
        requiredFields.push("quantity");
      }

      console.log("📋 Required fields:", requiredFields);
      console.log("📋 Received data keys:", Object.keys(vegetableData));

      const missingFields = requiredFields.filter((field) => {
        const value = vegetableData[field];
        const isMissing = value === undefined || value === null || value === "";
        if (isMissing) {
          console.log(`❌ Missing field: ${field} = ${value}`);
        }
        return isMissing;
      });

      if (missingFields.length > 0) {
        console.error("❌ Missing required fields:", missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }
      console.log("✅ Step 4: All required fields present");

      // Additional validation
      console.log("🔍 Step 5: Validating data types...");
      console.log("Price validation:", {
        price: vegetableData.price,
        type: typeof vegetableData.price,
        isNumber: typeof vegetableData.price === "number",
        isPositive: vegetableData.price >= 0,
      });

      if (typeof vegetableData.price !== "number" || vegetableData.price < 0) {
        console.error("❌ Invalid price:", vegetableData.price);
        throw new Error("Price must be a number and cannot be negative");
      }

      // Quantity validation - different for prebooking vs regular products
      if (!isPreBookingProduct) {
        console.log("Quantity validation:", {
          quantity: vegetableData.quantity,
          type: typeof vegetableData.quantity,
          isNumber: typeof vegetableData.quantity === "number",
          isPositive: vegetableData.quantity > 0,
        });

        if (
          typeof vegetableData.quantity !== "number" ||
          vegetableData.quantity <= 0
        ) {
          console.error("❌ Invalid quantity:", vegetableData.quantity);
          throw new Error("Quantity must be a positive number");
        }
      } else {
        // For prebooking products, set quantity to 0 if not provided
        if (!vegetableData.quantity) {
          vegetableData.quantity = 0;
        }
      }

      console.log("✅ Step 6: Data type validation passed");

      // Log the request
      console.log("✅ Step 7: Logging sanitized request data");
      console.log("Creating vegetable with data:", {
        ...vegetableData,
        owner_id: vegetableData.owner_id,
      });

      // Prepare final data for database insert
      console.log("✅ Step 8: Preparing final data for database insert");
      const finalData = {
        ...vegetableData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🗄️ Final data for database insert:", finalData);

      // Use service role client to bypass any RLS issues
      console.log("✅ Step 9: Creating admin client");
      const adminClient = createSupabaseClient();
      console.log("🔧 Admin client created:", !!adminClient);

      console.log(
        "✅ Step 10: Attempting database insert to table:",
        this.tableName
      );
      // WORKAROUND: Insert without relationship first
      const { data, error } = await adminClient
        .from(this.tableName)
        .insert([finalData])
        .select("*");

      console.log("📥 Database response:", { data, error });

      if (error) {
        console.error("❌ Supabase error details:", {
          message: error?.message || "No message",
          details: error?.details || "No details",
          hint: error?.hint || "No hint",
          code: error?.code || "No code",
          errorObject: error,
          errorString: String(error),
          requestData: finalData,
          tableName: this.tableName,
        });

        // Check for specific error codes
        if (error.code === "42501") {
          throw new Error(
            "Permission denied. Please check if you are properly logged in."
          );
        }

        if (error.code === "23502") {
          throw new Error(`Missing required field: ${error.message}`);
        }

        if (error.code === "23503") {
          throw new Error(`Foreign key constraint error: ${error.message}`);
        }

        const errorMessage =
          error?.message || error?.toString() || "Failed to create vegetable";
        throw new Error(`Database error: ${errorMessage}`);
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after creating vegetable");
      }

      console.log("Successfully created vegetable, fetching owner data...");

      // Fetch owner data separately
      try {
        const createdVegetable = data[0];

        if (createdVegetable.owner_id) {
          const { data: ownerData, error: ownerError } = await adminClient
            .from("users")
            .select(
              "id, name, email, phone, whatsapp_number, location, avatar_url"
            )
            .eq("id", createdVegetable.owner_id)
            .single();

          if (!ownerError && ownerData) {
            const completeVegetable = {
              ...createdVegetable,
              owner: ownerData,
            };
            console.log(
              "Successfully created vegetable with owner data:",
              completeVegetable
            );

            return completeVegetable;
          }
        }

        console.log("Successfully created vegetable:", createdVegetable);

        return createdVegetable;
      } catch (ownerFetchError) {
        console.warn(
          "Could not fetch owner data for created vegetable:",
          ownerFetchError
        );

        return data[0];
      }
    } catch (error) {
      console.error("💥 Error in createVegetable - DETAILED DEBUG:", {
        message: error?.message || "No message",
        name: error?.name || "No name",
        stack: error?.stack || "No stack",
        code: error?.code || "No code",
        details: error?.details || "No details",
        hint: error?.hint || "No hint",
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys: Object.keys(error || {}),
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        vegetableData: vegetableData,
        hasError: !!error,
        isErrorObject: error instanceof Error,
        errorProto: Object.getPrototypeOf(error),
      });

      // Log the error in multiple ways to ensure we capture it
      console.log("Raw error object:", error);
      console.log("Error toString:", error?.toString());
      console.log("Error valueOf:", error?.valueOf());

      throw error;
    }
  }

  async updateVegetable(id, vegetableData) {
    try {
      if (!id) {
        throw new Error("Vegetable ID is required");
      }

      // Prepare update data (exclude created_at, add updated_at)
      const updateData = {
        ...vegetableData,
        updated_at: new Date().toISOString(),
      };

      // Remove created_at from update data if it exists
      delete updateData.created_at;

      const adminClient = createSupabaseClient();

      let data, error;
      try {
        // Update without relationship query to avoid schema cache issue
        const response = await adminClient
          .from(this.tableName)
          .update(updateData)
          .eq("id", id)
          .select("*");

        data = response?.data;
        error = response?.error;
      } catch (updateException) {
        throw updateException;
      }

      if (error) {
        throw new Error(
          `Update error: ${error.message || "Failed to update vegetable"}`
        );
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after updating vegetable");
      }

      // Fetch owner data separately to avoid schema cache issue
      const updatedVegetable = data[0];

      try {
        if (!updatedVegetable?.owner_id) {
          return updatedVegetable;
        }

        const { data: ownerData, error: ownerError } = await adminClient
          .from("users")
          .select(
            "id, name, email, phone, whatsapp_number, location, avatar_url"
          )
          .eq("id", updatedVegetable.owner_id)
          .single();

        if (ownerError) {
          console.warn("Could not fetch owner data:", ownerError);
          return updatedVegetable;
        }

        return {
          ...updatedVegetable,
          owner: ownerData,
        };
      } catch (ownerFetchError) {
        console.warn("Error fetching owner data:", ownerFetchError);
        return updatedVegetable;
      }
    } catch (error) {
      console.error("Error updating vegetable:", error);
      throw error;
    }
  }

  async deleteVegetable(id) {
    try {
      if (!id) {
        throw new Error("Vegetable ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting vegetable:", error);
      throw error;
    }
  }

  async getCategories() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      // Extract unique categories
      const categories = [...new Set(data?.map((item) => item.category) || [])];
      return categories.filter(Boolean); // Remove any empty/null values
    } catch (error) {
      console.error("Error fetching categories:", error);
      return ["Leafy", "Root", "Fruit", "Herbs", "Vegetable"]; // Fallback categories
    }
  }

  async getLocations() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .select("location")
        .not("location", "is", null);

      if (error) throw error;

      // Extract unique locations
      const locations = [...new Set(data?.map((item) => item.location) || [])];
      return locations.filter(Boolean); // Remove any empty/null values
    } catch (error) {
      console.error("Error fetching locations:", error);
      return []; // Return empty array on error
    }
  }

  async uploadImage(file, userId = null) {
    console.log("🔍 UPLOAD DEBUG: Function called with file:", file?.name);

    try {
      if (!file) {
        throw new Error("File is required");
      }

      // Check if bucket exists first by trying to list it
      console.log("📋 Checking if images bucket exists...");
      console.log("🔧 Supabase client:", !!supabase);

      try {
        const { data: buckets, error: bucketsError } =
          await supabase.storage.listBuckets();

        console.log("📋 Raw buckets response:", {
          data: buckets,
          error: bucketsError,
        });
        console.log("📋 Available buckets:", buckets);
        console.log(
          "📋 Bucket names:",
          buckets?.map((b) => b.name)
        );

        if (bucketsError) {
          console.log("❌ Error listing buckets:", bucketsError);
          // Continue anyway - maybe the bucket exists but we can't list it
        }

        // If we can't list buckets or no buckets returned, skip the check and try upload anyway
        if (!buckets || buckets.length === 0) {
          console.log(
            "⚠️ No buckets returned or can't list buckets, trying upload anyway..."
          );
        } else {
          const imagesBucket = buckets?.find((b) => b.name === "images");
          if (!imagesBucket) {
            console.log(
              "❌ Images bucket not found in list:",
              buckets?.map((b) => b.name)
            );
            console.log(
              "🔄 Trying upload anyway in case bucket exists but isn't listed..."
            );
          } else {
            console.log("✅ Images bucket found:", imagesBucket);
          }
        }
      } catch (bucketError) {
        console.error("🚨 Bucket check failed:", bucketError);
        console.log("🔄 Continuing with upload attempt anyway...");
      }

      console.log("⏭️ Skipping bucket check - proceeding with upload...");

      // Get user limits for image validation
      let userLimits = null;
      try {
        const userRole = await ListingLimitService.getUserRole(userId);
        const { getUserLimits } = await import("@/config/listingLimits");
        userLimits = getUserLimits(userRole);
      } catch (error) {
        console.warn("Could not get user limits, using defaults:", error);
      }

      // Validate and optimize image with user-specific limits
      imageOptimizationService.validateImageFile(file, userLimits);
      console.log("✅ File validation passed with limits:", userLimits);

      // Create optimized image variants
      console.log("🎨 Creating optimized image variants...");
      const variants = await imageOptimizationService.createImageVariants(file);

      // Upload all variants to Supabase
      const uploadedVariants = {};
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);

      for (const [variantName, variantData] of Object.entries(variants)) {
        const fileName = `${timestamp}-${randomId}_${variantName}.webp`;
        const filePath = `vegetables/${fileName}`;

        // Convert blob to file for upload
        const optimizedFile = imageOptimizationService.blobToFile(
          variantData.blob,
          file.name,
          variantName
        );

        console.log(
          `📤 Uploading ${variantName} variant (${variantData.sizeKB}KB)...`
        );

        const { data, error } = await supabase.storage
          .from("images")
          .upload(filePath, optimizedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error(`❌ Upload failed for ${variantName}:`, error);
          throw new Error(`Upload failed for ${variantName}: ${error.message}`);
        }

        if (!data) {
          throw new Error(
            `Upload succeeded but no data returned for ${variantName}`
          );
        }

        // Get public URL for this variant
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get public URL for ${variantName}`);
        }

        uploadedVariants[variantName] = {
          url: urlData.publicUrl,
          size: variantData.size,
          sizeKB: variantData.sizeKB,
        };

        console.log(
          `✅ ${variantName} uploaded successfully: ${variantData.sizeKB}KB`
        );
      }

      console.log("🎉 All variants uploaded successfully:", {
        thumbnail: uploadedVariants.thumbnail.sizeKB + "KB",
        medium: uploadedVariants.medium.sizeKB + "KB",
        large: uploadedVariants.large.sizeKB + "KB",
        totalSize:
          Object.values(uploadedVariants)
            .reduce((sum, v) => sum + parseFloat(v.sizeKB), 0)
            .toFixed(1) + "KB",
      });

      // Return the medium variant URL as primary (for backward compatibility)
      // But also return all variants for future use
      return {
        url: uploadedVariants.medium.url, // Primary URL
        variants: uploadedVariants, // All variants
      };
    } catch (error) {
      console.error("💥 Upload error:", error);
      throw error;
    }
  }

  async getCategories() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      // Get unique categories and filter out null/empty values
      const uniqueCategories = [
        ...new Set(data.map((item) => item.category)),
      ].filter(Boolean);
      return uniqueCategories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  async getLocations() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .select("location")
        .not("location", "is", null);

      if (error) throw error;

      // Get unique locations and filter out null/empty values
      const uniqueLocations = [
        ...new Set(data.map((item) => item.location)),
      ].filter(Boolean);
      return uniqueLocations;
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  }

  // Helper methods for free items
  async getFreeVegetables() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      // WORKAROUND: Fetch free vegetables without relationship first
      const { data: vegetables, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("price", 0);

      if (error) {
        console.error("Error fetching free vegetables:", error);
        throw error;
      }

      if (!vegetables || vegetables.length === 0) {
        return [];
      }

      // Get unique owner IDs
      const ownerIds = [
        ...new Set(vegetables.map((v) => v.owner_id).filter(Boolean)),
      ];

      if (ownerIds.length === 0) {
        return vegetables;
      }

      // Fetch all owners in one query
      const { data: owners, error: ownerError } = await supabase
        .from("users")
        .select("id, name, email, phone, whatsapp_number, location, avatar_url")
        .in("id", ownerIds);

      if (ownerError) {
        console.warn(
          "Could not fetch owner data for free vegetables:",
          ownerError
        );
        return vegetables;
      }

      // Create owner lookup map
      const ownerMap = {};
      owners?.forEach((owner) => {
        ownerMap[owner.id] = owner;
      });

      // Combine vegetables with owner data
      const vegetablesWithOwners = vegetables.map((vegetable) => ({
        ...vegetable,
        owner: ownerMap[vegetable.owner_id] || null,
      }));

      return vegetablesWithOwners;
    } catch (error) {
      console.error("Error fetching free vegetables:", error);
      return [];
    }
  }

  isFreeVegetable(vegetable) {
    return Number(vegetable.price) === 0;
  }

  async getFreeVegetableCount() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { count, error } = await supabase
        .from(this.tableName)
        .select("id", { count: "exact" })
        .eq("price", 0);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching free vegetables count:", error);
      return 0;
    }
  }

  /**
   * Updates vegetable quantities after an order is placed
   * @param {Array} orderItems - Array of items with {id, quantity} structure
   * @returns {Promise<boolean>} - Success status
   */
  async updateQuantitiesAfterOrder(orderItems) {
    try {
      console.log("🔄 Updating vegetable quantities after order:", orderItems);
      console.log(
        "🔍 Order items structure:",
        JSON.stringify(orderItems, null, 2)
      );

      if (
        !orderItems ||
        !Array.isArray(orderItems) ||
        orderItems.length === 0
      ) {
        console.error("❌ Invalid order items:", {
          orderItems,
          isArray: Array.isArray(orderItems),
          length: orderItems?.length,
        });
        throw new Error("Order items are required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      // Use admin client to ensure permissions
      const adminClient = createSupabaseClient();

      // Process each item in the order
      for (const item of orderItems) {
        const { id: vegetableId, quantity: orderedQuantity } = item;

        if (!vegetableId || !orderedQuantity || orderedQuantity <= 0) {
          console.warn("⚠️ Skipping invalid order item:", item);
          continue;
        }

        console.log(
          `📦 Processing vegetable ${vegetableId}, reducing by ${orderedQuantity}`
        );

        // First, get current quantity to validate the update
        const { data: currentVeg, error: fetchError } = await adminClient
          .from(this.tableName)
          .select("id, name, quantity")
          .eq("id", vegetableId)
          .single();

        if (fetchError) {
          console.error(
            `❌ Error fetching vegetable ${vegetableId}:`,
            fetchError
          );
          continue; // Continue with other items
        }

        if (!currentVeg) {
          console.warn(`⚠️ Vegetable ${vegetableId} not found, skipping`);
          continue;
        }

        const currentQuantity = currentVeg.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - orderedQuantity);

        console.log(
          `📊 ${currentVeg.name}: ${currentQuantity} → ${newQuantity} (ordered: ${orderedQuantity})`
        );

        // Update the quantity
        const { data: updatedVeg, error: updateError } = await adminClient
          .from(this.tableName)
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vegetableId)
          .select("id, name, quantity")
          .single();

        if (updateError) {
          console.error(
            `❌ Error updating quantity for vegetable ${vegetableId}:`,
            updateError
          );
          // Continue with other items instead of failing completely
          continue;
        }

        console.log(
          `✅ Updated ${updatedVeg.name} quantity to ${updatedVeg.quantity}`
        );

        // Optional: Log if quantity went to zero or negative
        if (newQuantity <= 0) {
          console.log(
            `⚠️ ${currentVeg.name} is now out of stock (quantity: ${newQuantity})`
          );
        }
      }

      console.log("✅ Finished updating all vegetable quantities");
      return true;
    } catch (error) {
      console.error("💥 Error updating vegetable quantities:", error);
      throw error;
    }
  }

  /**
   * Restore product quantities when an order is cancelled
   * @param {string} orderId - The order ID to restore quantities for
   * @param {string} orderType - 'regular' or 'guest'
   */
  async restoreQuantitiesAfterCancellation(orderId, orderType = "regular") {
    try {
      console.log(
        `🔄 Starting quantity restoration for cancelled ${orderType} order: ${orderId}`
      );

      if (!supabase) throw new Error("Supabase not initialized");

      // Use admin client to ensure permissions
      const adminClient = createSupabaseClient();

      let orderItems = [];

      if (orderType === "regular") {
        // Get order items from order_items table for regular orders
        const { data: items, error: itemsError } = await adminClient
          .from("order_items")
          .select("vegetable_id, quantity")
          .eq("order_id", orderId);

        if (itemsError) {
          console.error(
            `❌ Error fetching order items for order ${orderId}:`,
            itemsError
          );
          throw itemsError;
        }

        console.log(
          `📦 Found ${items?.length || 0} regular order items:`,
          items
        );

        orderItems =
          items?.map((item) => ({
            id: item.vegetable_id,
            quantity: item.quantity,
          })) || [];
      } else if (orderType === "guest") {
        // Get order items from guest_orders.order_items JSONB field
        const { data: guestOrder, error: guestError } = await adminClient
          .from("guest_orders")
          .select("order_items")
          .eq("id", orderId)
          .single();

        if (guestError) {
          console.error(
            `❌ Error fetching guest order ${orderId}:`,
            guestError
          );
          throw guestError;
        }

        orderItems = guestOrder?.order_items || [];
      }

      if (!orderItems || orderItems.length === 0) {
        console.log(`ℹ️ No items found for ${orderType} order ${orderId}`);
        return true;
      }

      console.log(
        `📋 Found ${orderItems.length} items to restore:`,
        JSON.stringify(orderItems, null, 2)
      );

      // Process each item to restore quantities
      for (const item of orderItems) {
        // For regular orders: item has vegetable_id field
        // For guest orders: item has id field (which is the vegetable ID)
        const vegetableId = item.vegetable_id || item.id;
        const quantityToRestore = item.quantity;

        if (!vegetableId || !quantityToRestore || quantityToRestore <= 0) {
          console.warn("⚠️ Skipping invalid order item:", item);
          continue;
        }

        console.log(
          `📦 Processing vegetable ${vegetableId}, restoring ${quantityToRestore}`
        );

        // First, get current quantity
        const { data: currentVeg, error: fetchError } = await adminClient
          .from(this.tableName)
          .select("id, name, quantity")
          .eq("id", vegetableId)
          .single();

        if (fetchError) {
          console.error(
            `❌ Error fetching vegetable ${vegetableId}:`,
            fetchError
          );
          continue; // Continue with other items
        }

        if (!currentVeg) {
          console.warn(`⚠️ Vegetable ${vegetableId} not found, skipping`);
          continue;
        }

        const currentQuantity = currentVeg.quantity || 0;
        const newQuantity = currentQuantity + quantityToRestore;

        console.log(
          `📊 Restoring ${currentVeg.name}: ${currentQuantity} → ${newQuantity} (+${quantityToRestore})`
        );

        // Update the quantity
        const { data: updatedVeg, error: updateError } = await adminClient
          .from(this.tableName)
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vegetableId)
          .select("id, name, quantity")
          .single();

        if (updateError) {
          console.error(
            `❌ Error restoring quantity for vegetable ${vegetableId}:`,
            updateError
          );
          console.error(
            `❌ Full error details:`,
            JSON.stringify(updateError, null, 2)
          );
          // Continue with other items instead of failing completely
          continue;
        }

        if (!updatedVeg) {
          console.error(
            `❌ No updated vegetable data returned for ${vegetableId}`
          );
          continue;
        }

        console.log(
          `✅ Successfully restored ${updatedVeg.name} quantity to ${updatedVeg.quantity}`
        );
      }

      console.log("✅ Finished restoring all vegetable quantities");
      return true;
    } catch (error) {
      console.error("❌ Error in restoreQuantitiesAfterCancellation:", error);
      throw error;
    }
  }
}

export default new VegetableService();
