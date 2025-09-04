import ApiBaseService from "./ApiBaseService";
import { supabase } from "@/lib/supabase";
import { createSupabaseClient } from "@/utils/supabaseAuth";

class PreBookingService extends ApiBaseService {
  constructor() {
    super("vegetable_prebookings");
    this.requestsTable = "vegetable_requests";
  }

  // =============================================================================
  // VEGETABLE REQUESTS METHODS
  // =============================================================================

  /**
   * Get all vegetable requests with optional filtering
   */
  async getVegetableRequests(filters = {}) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      let query = supabase
        .from(this.requestsTable)
        .select(
          `
          *,
          requester:users!vegetable_requests_requested_by_fkey(
            id, name, location, avatar_url
          )
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.targetSeason && filters.targetSeason !== "all") {
        query = query.eq("target_season", filters.targetSeason);
      }

      if (filters.urgencyLevel && filters.urgencyLevel !== "all") {
        query = query.eq("urgency_level", filters.urgencyLevel);
      }

      if (filters.searchQuery) {
        query = query.or(
          `vegetable_name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching vegetable requests:", error);
      return [];
    }
  }

  /**
   * Create a new vegetable request
   */
  async createVegetableRequest(requestData) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const finalData = {
        ...requestData,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.requestsTable)
        .insert([finalData]).select(`
          *,
          requester:users!vegetable_requests_requested_by_fkey(
            id, name, location, avatar_url
          )
        `);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Error creating vegetable request:", error);
      throw error;
    }
  }

  // =============================================================================
  // PREBOOKING METHODS
  // =============================================================================

  /**
   * Create a new prebooking
   */
  async createPreBooking(preBookingData) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const finalData = {
        ...preBookingData,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🌱 Creating prebooking with data:", {
        ...finalData,
        dataKeys: Object.keys(finalData),
        dataTypes: Object.keys(finalData).reduce((acc, key) => {
          acc[key] = typeof finalData[key];
          return acc;
        }, {})
      });

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([finalData]).select(`
          *,
          user:users!vegetable_prebookings_user_id_fkey(
            id, name, phone, location, avatar_url
          ),
          seller:users!vegetable_prebookings_seller_id_fkey(
            id, name, phone, whatsapp_number, location, avatar_url
          )
        `);

      if (error) {
        console.error("❌ Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }

      console.log("✅ Prebooking created successfully:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error creating prebooking:", error);
      throw error;
    }
  }

  /**
   * Get prebookings by user ID
   */
  async getPreBookingsByUser(userId) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          seller:users!vegetable_prebookings_seller_id_fkey(
            id, name, phone, whatsapp_number, location, avatar_url
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user prebookings:", error);
      return [];
    }
  }

  /**
   * Get prebookings by seller ID
   */
  async getPreBookingsBySeller(sellerId) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          user:users!vegetable_prebookings_user_id_fkey(
            id, name, phone, location, avatar_url
          )
        `
        )
        .eq("seller_id", sellerId)
        .order("target_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching seller prebookings:", error);
      return [];
    }
  }

  /**
   * Update prebooking status and details
   */
  async updatePreBookingStatus(id, updates) {
    try {
      const adminClient = createSupabaseClient();

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await adminClient
        .from(this.tableName)
        .update(updateData)
        .eq("id", id).select(`
          *,
          user:users!vegetable_prebookings_user_id_fkey(
            id, name, phone, location, avatar_url
          ),
          seller:users!vegetable_prebookings_seller_id_fkey(
            id, name, phone, whatsapp_number, location, avatar_url
          )
        `);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Error updating prebooking status:", error);
      throw error;
    }
  }

  /**
   * Cancel a prebooking
   */
  async cancelPreBooking(id, userId, reason = null) {
    try {
      const updates = {
        status: "cancelled",
        user_notes: reason ? `Cancelled: ${reason}` : "Cancelled by user",
      };

      return await this.updatePreBookingStatus(id, updates);
    } catch (error) {
      console.error("Error cancelling prebooking:", error);
      throw error;
    }
  }

  // =============================================================================
  // DEMAND ANALYTICS METHODS
  // =============================================================================

  /**
   * Get demand analytics from the view
   */
  async getDemandAnalytics(filters = {}) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      let query = supabase
        .from("vegetable_demand_view")
        .select("*")
        .order("total_prebookings", { ascending: false });

      // Apply filters
      if (filters.sellerId) {
        query = query.eq("seller_id", filters.sellerId);
      }

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.demandLevel && filters.demandLevel !== "all") {
        query = query.eq("demand_level", filters.demandLevel);
      }

      if (filters.minDemand) {
        query = query.gte("total_prebookings", filters.minDemand);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching demand analytics:", error);
      return [];
    }
  }

  /**
   * Get high demand vegetables (20+ prebookings)
   */
  async getHighDemandVegetables(sellerId = null) {
    try {
      const filters = {
        demandLevel: "high",
        minDemand: 20,
      };

      if (sellerId) {
        filters.sellerId = sellerId;
      }

      return await this.getDemandAnalytics(filters);
    } catch (error) {
      console.error("Error fetching high demand vegetables:", error);
      return [];
    }
  }

  /**
   * Get prebooking statistics for seller dashboard
   */
  async getSellerPrebookingStats(sellerId) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      // Get overall stats
      const { data: stats, error: statsError } = await supabase
        .from(this.tableName)
        .select("status, quantity, estimated_price")
        .eq("seller_id", sellerId);

      if (statsError) throw statsError;

      // Calculate statistics
      const totalPrebookings = stats.length;
      const pendingPrebookings = stats.filter(
        (p) => p.status === "pending"
      ).length;
      const acceptedPrebookings = stats.filter(
        (p) => p.status === "accepted"
      ).length;
      const completedPrebookings = stats.filter(
        (p) => p.status === "delivered"
      ).length;
      const totalQuantity = stats.reduce(
        (sum, p) => sum + parseFloat(p.quantity || 0),
        0
      );
      const totalValue = stats.reduce(
        (sum, p) =>
          sum +
          parseFloat(p.estimated_price || 0) * parseFloat(p.quantity || 0),
        0
      );

      return {
        totalPrebookings,
        pendingPrebookings,
        acceptedPrebookings,
        completedPrebookings,
        totalQuantity,
        totalValue,
        fulfillmentRate:
          totalPrebookings > 0
            ? ((completedPrebookings / totalPrebookings) * 100).toFixed(1)
            : 0,
      };
    } catch (error) {
      console.error("Error fetching seller prebooking stats:", error);
      return {
        totalPrebookings: 0,
        pendingPrebookings: 0,
        acceptedPrebookings: 0,
        completedPrebookings: 0,
        totalQuantity: 0,
        totalValue: 0,
        fulfillmentRate: 0,
      };
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get unique categories from requests
   */
  async getRequestCategories() {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.requestsTable)
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      const categories = [...new Set(data?.map((item) => item.category) || [])];
      return categories.filter(Boolean);
    } catch (error) {
      console.error("Error fetching request categories:", error);
      return ["Leafy", "Root", "Fruit", "Herbs", "Vegetable"];
    }
  }

  /**
   * Check if user has existing prebooking for same vegetable from same seller
   */
  async checkExistingPreBooking(userId, sellerId, vegetableName) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.tableName)
        .select("id, status")
        .eq("user_id", userId)
        .eq("seller_id", sellerId)
        .eq("vegetable_name", vegetableName)
        .in("status", ["pending", "accepted", "in_progress"]);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Error checking existing prebooking:", error);
      return null;
    }
  }

  /**
   * Get seasonal planting suggestions based on current date
   */
  getSeasonalSuggestions() {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const seasonalMap = {
      winter: {
        months: [12, 1, 2],
        vegetables: [
          "carrots",
          "cabbage",
          "cauliflower",
          "peas",
          "spinach",
          "radish",
        ],
      },
      spring: {
        months: [3, 4, 5],
        vegetables: [
          "lettuce",
          "beans",
          "peas",
          "carrots",
          "herbs",
          "leafy greens",
        ],
      },
      summer: {
        months: [6, 7, 8],
        vegetables: [
          "tomatoes",
          "cucumbers",
          "peppers",
          "eggplant",
          "okra",
          "herbs",
        ],
      },
      monsoon: {
        months: [9, 10, 11],
        vegetables: [
          "leafy greens",
          "okra",
          "gourds",
          "beans",
          "chillies",
          "coriander",
        ],
      },
    };

    for (const [season, data] of Object.entries(seasonalMap)) {
      if (data.months.includes(currentMonth)) {
        return {
          currentSeason: season,
          recommendedVegetables: data.vegetables,
          plantingAdvice: `Great time to plant ${season} vegetables!`,
        };
      }
    }

    return {
      currentSeason: "transition",
      recommendedVegetables: ["herbs", "leafy greens"],
      plantingAdvice: "Transition period - perfect for herbs and leafy greens",
    };
  }
}

export default new PreBookingService();
