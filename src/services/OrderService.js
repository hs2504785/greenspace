import ApiBaseService from "./ApiBaseService";
import { supabase } from "@/lib/supabase";
import { mockOrders } from "@/data/mockOrders";
import VegetableService from "./VegetableService";
import { updateProfileIfEmpty } from "@/utils/profileUtils";

class OrderService extends ApiBaseService {
  constructor() {
    super("orders");
  }

  async getOrdersByUser(userId) {
    try {
      console.log("🔍 Fetching orders for user:", userId);
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          buyer:users!user_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `
        )
        .eq("user_id", userId) // Only fetch orders for this specific user
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      console.log("✅ Orders fetched successfully:", data?.length || 0);
      if (data && data.length > 0) {
        console.log(
          "📋 Order IDs found:",
          data.map((order) => order.id)
        );
        console.log(
          "👤 Order user_ids:",
          data.map((order) => order.user_id)
        );
      } else {
        console.log("📭 No orders found for user:", userId);
      }
      return data || [];
    } catch (error) {
      console.error("Error in getOrdersByUser:", error);
      throw error;
    }
  }

  async getOrdersBySeller(sellerId) {
    try {
      console.log("Fetching orders for seller:", sellerId);
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          buyer:users!user_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching seller orders:", error);
        throw error;
      }

      console.log("Seller orders fetched successfully:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error("Error in getOrdersBySeller:", error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      console.log("Fetching order details:", { id });

      // First check database (where real orders are stored)
      if (!supabase) {
        console.log("Supabase not available, checking mock data");
        // Check mock data
        const mockOrder = mockOrders.find((order) => order.id === id);
        if (mockOrder) {
          return mockOrder;
        }
        throw new Error("Order not found in mock data");
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching order from database:", error);

        // Check if this is a "not found" error (common with old order IDs)
        if (
          error.code === "PGRST116" ||
          error.details === "The result contains 0 rows"
        ) {
          console.log(
            `📭 Order ${id} not found in database (likely old/invalid ID)`
          );
          const notFoundError = new Error(`Order ${id} not found`);
          notFoundError.code = "ORDER_NOT_FOUND";
          throw notFoundError;
        }

        throw error;
      }

      console.log("✅ Found order in database:", data.id);
      return data;
    } catch (error) {
      console.error("Error in getOrderById:", error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      console.log("Creating order with data:", {
        userId: orderData.userId,
        sellerId: orderData.sellerId,
        total: orderData.total,
        items: orderData.items,
      });

      if (!supabase) throw new Error("Supabase not initialized");
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: orderData.userId,
            seller_id: orderData.sellerId,
            status: "pending",
            total_amount: orderData.total,
            delivery_address: orderData.deliveryAddress,
            contact_number: orderData.contactNumber,
            created_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (orderError) {
        console.error("Error creating order:", {
          error: orderError,
          data: orderData,
        });
        throw orderError;
      }

      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        vegetable_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        throw itemsError;
      }

      // Update vegetable quantities after successful order creation
      try {
        console.log("🔄 Updating vegetable quantities after order creation...");
        console.log(
          "📋 Items to update:",
          JSON.stringify(orderData.items, null, 2)
        );
        await VegetableService.updateQuantitiesAfterOrder(orderData.items);
        console.log("✅ Vegetable quantities updated successfully");
      } catch (quantityError) {
        console.error("⚠️ Error updating vegetable quantities:", quantityError);
        console.error("⚠️ Full error details:", quantityError.stack);
        // Don't fail the order creation if quantity update fails
        // Log the error but continue with order completion
        console.log("📝 Order created successfully but quantity update failed");
      }

      // Update user profile with location and contact info if they are empty
      try {
        console.log(
          "🔄 Checking if user profile needs updating with checkout info..."
        );
        await updateProfileIfEmpty(
          orderData.userId,
          orderData.deliveryAddress,
          orderData.contactNumber
        );
        console.log("✅ Profile update check completed");
      } catch (profileError) {
        console.error("⚠️ Error updating user profile:", profileError);
        // Don't fail the order creation if profile update fails
        // Log the error but continue with order completion
        console.log("📝 Order created successfully but profile update failed");
      }

      // Fetch the complete order with relationships
      const { data: completeOrder, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `
        )
        .eq("id", order.id)
        .single();

      if (fetchError) {
        console.error("Error fetching complete order:", fetchError);
        throw fetchError;
      }

      return completeOrder;
    } catch (error) {
      console.error("Error in createOrder:", error);
      throw error;
    }
  }

  async updateOrderStatus(id, status) {
    try {
      console.log(
        "✅ OrderService Update Step 1: Starting order status update:",
        { id, status }
      );

      // Validate inputs
      if (!id) {
        throw new Error("Order ID is required");
      }
      if (!status) {
        throw new Error("Status is required");
      }

      console.log("✅ OrderService Update Step 2: Input validation passed");

      if (!supabase) throw new Error("Supabase not initialized");
      console.log("✅ OrderService Update Step 3: Supabase client available");

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };
      console.log(
        "✅ OrderService Update Step 4: Update data prepared:",
        updateData
      );

      console.log(
        "📤 OrderService Update Step 5: Attempting database update..."
      );

      let data, error;
      try {
        console.log("🔍 Making Supabase update call...");
        const response = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

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
        errorType: error ? typeof error : "no error",
        errorConstructor: error ? error.constructor.name : "no error",
        errorIsNull: error === null,
        errorIsUndefined: error === undefined,
        errorKeys: error ? Object.keys(error) : "no error",
      });

      if (error) {
        console.log("❌ OrderService Update error details:", {
          message: error.message || "No message",
          details: error.details || "No details",
          hint: error.hint || "No hint",
          code: error.code || "No code",
          errorObject: error,
          errorString: JSON.stringify(error),
          errorToString: error.toString ? error.toString() : "No toString",
        });

        console.log("🔍 Raw error object:", error);
        console.log("🔍 Error toString:", error.toString());
        console.log("🔍 Error properties:", Object.keys(error));

        throw new Error(
          `Order status update error: ${error.message || JSON.stringify(error)}`
        );
      }

      console.log(
        "✅ OrderService Update Step 6: Successfully updated order status"
      );
      return data;
    } catch (error) {
      console.log("💥 Error in updateOrderStatus - DETAILED DEBUG:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code || "No code",
        errorType: typeof error,
        errorConstructor: error.constructor.name,
        errorKeys: Object.keys(error),
        fullError: error,
      });

      console.error("Error in updateOrderStatus:", error);
      throw error;
    }
  }
}

export default new OrderService();
