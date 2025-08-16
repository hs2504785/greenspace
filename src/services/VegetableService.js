import ApiBaseService from "./ApiBaseService";
import { supabase } from "@/lib/supabase";
import { createSupabaseClient } from "@/utils/supabaseAuth";
// import { mockVegetables } from '@/data/mockVegetables'; // Removed - no longer using mock data

class VegetableService extends ApiBaseService {
  constructor() {
    super("vegetables");
  }

  async getAllVegetables() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase.from(this.tableName).select(`
          *,
          owner:users!owner_id(
            id, name, email, phone, whatsapp_number, location, avatar_url
          )
        `);

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

      if (!data) {
        console.warn("No data returned from Supabase");
        return [];
      }

      return data;
    } catch (error) {
      console.error("Error fetching vegetables:", {
        message: error.message,
        stack: error.stack,
        fullError: error,
      });
      // Return empty array instead of mock data
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
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          "*, owner:users!owner_id(id, name, email, phone, whatsapp_number, location, avatar_url)"
        )
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

      if (!data) {
        throw new Error("Vegetable not found");
      }

      return data;
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
      console.log("🔍 Fetching vegetables for ownerId:", ownerId);

      if (!ownerId) {
        console.warn("No ownerId provided");
        return [];
      }

      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          "*, owner:users!owner_id(id, name, email, phone, whatsapp_number, location, avatar_url)"
        )
        .eq("owner_id", ownerId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("✅ Found vegetables:", data?.length || 0);
      return data || [];
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

      // Validate required fields
      console.log("🔍 Step 3: Validating required fields...");
      const requiredFields = [
        "name",
        "price",
        "quantity",
        "category",
        "location",
        "source_type",
        "owner_id",
      ];

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
      const { data, error } = await adminClient
        .from(this.tableName)
        .insert([finalData])
        .select(
          "*, owner:users!owner_id(id, name, email, phone, whatsapp_number, location, avatar_url)"
        );

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

      console.log("Successfully created vegetable:", data[0]);
      return data[0];
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
    console.log("🔄 updateVegetable called with:", { id, vegetableData });

    try {
      console.log("✅ Update Step 1: Function entry");

      if (!id) {
        console.error("❌ No vegetable ID provided");
        throw new Error("Vegetable ID is required");
      }
      console.log("✅ Update Step 2: Vegetable ID provided:", id);

      // Prepare update data (exclude created_at, add updated_at)
      const updateData = {
        ...vegetableData,
        updated_at: new Date().toISOString(),
      };

      // Remove created_at from update data if it exists
      delete updateData.created_at;

      console.log("✅ Update Step 3: Prepared update data:", updateData);

      // Use admin client for consistent permissions
      const adminClient = createSupabaseClient();
      console.log("✅ Update Step 4: Admin client created");

      console.log("📤 Update Step 5: Attempting database update...");

      let data, error;
      try {
        console.log("🔍 Making Supabase update call...");
        const response = await adminClient
          .from(this.tableName)
          .update(updateData)
          .eq("id", id)
          .select(
            "*, owner:users!owner_id(id, name, email, phone, whatsapp_number, location, avatar_url)"
          );

        console.log("🔍 Raw Supabase response:", response);
        data = response.data;
        error = response.error;
      } catch (updateException) {
        console.error("💥 Exception during update call:", updateException);
        throw updateException;
      }

      console.log("📥 Update database response:", { data, error });
      console.log("📥 Error type check:", {
        hasError: !!error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorIsNull: error === null,
        errorIsUndefined: error === undefined,
        errorIsObject: typeof error === "object",
        errorKeys: error ? Object.keys(error) : "no error",
      });

      if (error) {
        console.error("❌ Update error details:", {
          message: error?.message || "No message",
          details: error?.details || "No details",
          hint: error?.hint || "No hint",
          code: error?.code || "No code",
          errorObject: error,
          errorString: String(error),
          errorJSON: JSON.stringify(error, null, 2),
          errorProto: Object.getPrototypeOf(error),
          updateData: updateData,
          vegetableId: id,
          tableName: this.tableName,
        });

        // Log the error in multiple ways
        console.log("🔍 Raw error object:", error);
        console.log("🔍 Error toString:", error?.toString());
        console.log("🔍 Error properties:", Object.getOwnPropertyNames(error));

        const errorMessage =
          error?.message || error?.toString() || "Failed to update vegetable";
        throw new Error(`Update error: ${errorMessage}`);
      }

      if (!data || data.length === 0) {
        console.error("❌ No data returned from update");
        throw new Error("No data returned after updating vegetable");
      }

      console.log("✅ Update Step 6: Successfully updated vegetable:", data[0]);
      return data[0];
    } catch (error) {
      console.error("💥 Error in updateVegetable - DETAILED DEBUG:", {
        message: error?.message || "No message",
        name: error?.name || "No name",
        stack: error?.stack || "No stack",
        code: error?.code || "No code",
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys: Object.keys(error || {}),
        errorString: String(error),
        vegetableId: id,
        vegetableData: vegetableData,
        hasError: !!error,
        isErrorObject: error instanceof Error,
      });

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

  async uploadImage(file) {
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

      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(
            ", "
          )}`
        );
      }

      console.log("✅ File validation passed");

      // Create unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `vegetables/${fileName}`;

      console.log("📁 Upload path:", filePath);

      // Try upload with regular client first
      console.log("🔄 Attempting upload with regular client...");
      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Upload failed:", error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error("Upload succeeded but no data returned");
      }

      console.log("✅ Upload successful:", data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      console.log("🔗 Public URL generated:", urlData.publicUrl);
      return urlData.publicUrl;
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
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          "*, owner:users!owner_id(id, name, email, phone, whatsapp_number, location, avatar_url)"
        )
        .eq("price", 0);

      if (error) {
        console.error("Error fetching free vegetables:", error);
        throw error;
      }

      return data || [];
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

      if (
        !orderItems ||
        !Array.isArray(orderItems) ||
        orderItems.length === 0
      ) {
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
}

export default new VegetableService();
