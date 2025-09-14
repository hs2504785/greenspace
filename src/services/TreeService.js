import { supabase } from "@/lib/supabase";
import ApiBaseService from "./ApiBaseService";

class TreeService extends ApiBaseService {
  constructor() {
    super("trees");
  }

  /**
   * Get a single tree by ID with all related data
   */
  async getTreeById(id, isPosition = false) {
    try {
      if (!id) {
        throw new Error("Tree ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      // Use the API endpoint which handles both tree and position queries
      const url = `/api/trees/${id}${isPosition ? "?position=true" : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tree");
      }

      const tree = await response.json();
      return tree;
    } catch (error) {
      console.error("Error fetching tree:", {
        message: error.message,
        stack: error.stack,
        fullError: error,
      });
      throw error; // Re-throw error instead of returning null
    }
  }

  /**
   * Get all trees with optional filtering
   */
  async getAllTrees(options = {}) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { farmId, layoutId, includePositions = true } = options;

      let query = supabase.from(this.tableName);

      if (includePositions) {
        query = query.select(
          `
          *,
          tree_positions(
            id,
            grid_x,
            grid_y,
            block_index,
            planted_at,
            layout_id,
            variety,
            status,
            planting_date,
            notes,
            updated_at,
            latitude,
            longitude
          )
        `
        );
      } else {
        query = query.select("*");
      }

      // If farmId is provided, filter by farm_id OR get template trees (farm_id is null)
      if (farmId) {
        query = query.or(`farm_id.eq.${farmId},farm_id.is.null`);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching trees:", error);
        throw new Error(error.message || "Failed to fetch trees");
      }

      // Filter by layoutId if provided (at position level)
      let filteredData = data || [];
      if (layoutId && includePositions) {
        filteredData = data.filter((tree) =>
          tree.tree_positions?.some((pos) => pos.layout_id === layoutId)
        );
      }

      return filteredData;
    } catch (error) {
      console.error("Error fetching trees:", error);
      throw error;
    }
  }

  /**
   * Create a new tree
   */
  async createTree(treeData) {
    try {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(treeData)
        .select()
        .single();

      if (error) {
        console.error("Error creating tree:", error);
        throw new Error(error.message || "Failed to create tree");
      }

      return data;
    } catch (error) {
      console.error("Error creating tree:", error);
      throw error;
    }
  }

  /**
   * Update a tree
   */
  async updateTree(id, updateData) {
    try {
      if (!id) {
        throw new Error("Tree ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating tree:", error);
        throw new Error(error.message || "Failed to update tree");
      }

      return data;
    } catch (error) {
      console.error("Error updating tree:", error);
      throw error;
    }
  }

  /**
   * Delete a tree
   */
  async deleteTree(id) {
    try {
      if (!id) {
        throw new Error("Tree ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      // First delete all tree positions
      const { error: positionsError } = await supabase
        .from("tree_positions")
        .delete()
        .eq("tree_id", id);

      if (positionsError) {
        console.error("Error deleting tree positions:", positionsError);
        throw new Error(
          positionsError.message || "Failed to delete tree positions"
        );
      }

      // Then delete the tree
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting tree:", error);
        throw new Error(error.message || "Failed to delete tree");
      }

      return { success: true, message: "Tree deleted successfully" };
    } catch (error) {
      console.error("Error deleting tree:", error);
      throw error;
    }
  }

  /**
   * Get tree care logs for a specific tree
   */
  async getTreeCareLogs(treeId) {
    try {
      if (!treeId) {
        throw new Error("Tree ID is required");
      }

      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from("tree_care_logs")
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tree care logs:", error);
        throw new Error(error.message || "Failed to fetch tree care logs");
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching tree care logs:", error);
      throw error;
    }
  }
}

const treeService = new TreeService();
export default treeService;
