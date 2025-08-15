import ApiBaseService from "./ApiBaseService";
import { supabase } from "@/lib/supabase";
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
          "*, owner:users(id, name, email, phone, whatsapp, location, avatar_url)"
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching vegetable:", error);
      return null;
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
          "*, owner:users(id, name, email, phone, whatsapp_number, location, avatar_url)"
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
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      // Validate required fields
      const requiredFields = [
        "name",
        "price",
        "quantity",
        "category",
        "location",
        "source_type",
        "owner_id",
      ];
      const missingFields = requiredFields.filter(
        (field) =>
          vegetableData[field] === undefined ||
          vegetableData[field] === null ||
          vegetableData[field] === ""
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Additional validation
      if (typeof vegetableData.price !== "number" || vegetableData.price < 0) {
        throw new Error("Price must be a number and cannot be negative");
      }

      if (
        typeof vegetableData.quantity !== "number" ||
        vegetableData.quantity <= 0
      ) {
        throw new Error("Quantity must be a positive number");
      }

      // Log the request
      console.log("Creating vegetable with data:", {
        ...vegetableData,
        owner_id: vegetableData.owner_id,
      });

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([
          {
            ...vegetableData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*, owner:users(*)");

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          requestData: vegetableData,
        });

        if (error.code === "42501") {
          throw new Error(
            "Permission denied. Please check if you are properly logged in."
          );
        }

        throw new Error(error.message || "Failed to create vegetable");
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after creating vegetable");
      }

      console.log("Successfully created vegetable:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error creating vegetable:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        details: error.details,
        hint: error.hint,
        errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        vegetableData,
      });
      throw error;
    }
  }

  async updateVegetable(id, vegetableData) {
    try {
      if (!id) {
        throw new Error("Vegetable ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase
        .from(this.tableName)
        .update(vegetableData)
        .eq("id", id)
        .select("*, owner:users(*)");

      if (error) throw error;
      return data[0];
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

  async uploadImage(file) {
    try {
      if (!file) {
        throw new Error("File is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vegetables/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
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
          `
          *,
          owner:users!owner_id(
            id, name, email, phone, whatsapp_number, location, avatar_url
          )
        `
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
}

export default new VegetableService();
