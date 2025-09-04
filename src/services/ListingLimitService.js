import { createSupabaseClient } from "@/utils/supabaseAuth";
import {
  getUserLimits,
  canCreateProduct,
  getRemainingSlots,
  validateProductData,
} from "@/config/listingLimits";

class ListingLimitService {
  constructor() {
    this.supabase = createSupabaseClient();
  }

  // Get user's current product count
  async getUserProductCount(userId, productType = "regular") {
    try {
      const { count, error } = await this.supabase
        .from("vegetables")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId)
        .eq("product_type", productType);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting user product count:", error);
      throw new Error("Failed to check product count");
    }
  }

  // Get user role for limit calculation
  async getUserRole(userId) {
    try {
      if (!userId) {
        console.warn("No userId provided to getUserRole");
        return "buyer";
      }

      const { data: user, error } = await this.supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error getting user role:", {
          message: error.message,
          details: error.details,
          code: error.code,
          userId: userId,
        });
        return "buyer";
      }

      return user?.role || "buyer";
    } catch (error) {
      console.error("Error getting user role:", {
        message: error.message,
        stack: error.stack,
        userId: userId,
      });
      return "buyer"; // Default to basic user limits
    }
  }

  // Check if user can create a new product
  async canUserCreateProduct(userId, productType = "regular") {
    try {
      const [currentCount, userRole] = await Promise.all([
        this.getUserProductCount(userId, productType),
        this.getUserRole(userId),
      ]);

      const canCreate = canCreateProduct(currentCount, userRole);
      const remaining = getRemainingSlots(currentCount, userRole);
      const limits = getUserLimits(userRole);

      return {
        canCreate,
        currentCount,
        maxAllowed: limits.MAX_PRODUCTS,
        remaining,
        userRole,
        limits,
      };
    } catch (error) {
      console.error("Error checking if user can create product:", error);
      throw error;
    }
  }

  // Validate product data before creation
  async validateProduct(productData, userId) {
    try {
      const userRole = await this.getUserRole(userId);
      const validation = validateProductData(productData, userRole);

      // Also check if user can create more products
      const productType = productData.product_type || "regular";
      const limitCheck = await this.canUserCreateProduct(userId, productType);

      if (!limitCheck.canCreate) {
        validation.errors.push(
          `You have reached your product limit (${limitCheck.maxAllowed} products). ` +
            `Consider upgrading your account or removing old listings.`
        );
        validation.isValid = false;
      }

      return {
        ...validation,
        limitInfo: limitCheck,
      };
    } catch (error) {
      console.error("Error validating product:", error);
      throw error;
    }
  }

  // Get user's listing summary
  async getUserListingSummary(userId) {
    try {
      const [regularCount, prebookingCount, userRole] = await Promise.all([
        this.getUserProductCount(userId, "regular"),
        this.getUserProductCount(userId, "prebooking"),
        this.getUserRole(userId),
      ]);

      const limits = getUserLimits(userRole);
      const totalCount = regularCount + prebookingCount;

      return {
        regularProducts: regularCount,
        prebookingProducts: prebookingCount,
        totalProducts: totalCount,
        maxAllowed: limits.MAX_PRODUCTS,
        remaining: getRemainingSlots(totalCount, userRole),
        canCreateMore: canCreateProduct(totalCount, userRole),
        userRole,
        limits,
      };
    } catch (error) {
      console.error("Error getting user listing summary:", error);
      throw error;
    }
  }

  // Clean up old/inactive listings (admin function)
  async cleanupInactiveListings(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from("vegetables")
        .delete()
        .lt("updated_at", cutoffDate.toISOString())
        .eq("quantity", 0); // Only remove out-of-stock items

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error cleaning up inactive listings:", error);
      throw error;
    }
  }
}

export default new ListingLimitService();
