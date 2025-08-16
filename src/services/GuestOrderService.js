import ApiBaseService from "./ApiBaseService";

class GuestOrderService extends ApiBaseService {
  constructor() {
    super("/api/orders/guest");
  }

  /**
   * Get guest orders for a specific seller
   */
  async getGuestOrdersBySeller(sellerId) {
    try {
      const response = await fetch(`/api/orders/guest/seller/${sellerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch guest orders");
      }

      const data = await response.json();
      return data.guestOrders || [];
    } catch (error) {
      console.error("Error fetching guest orders:", error);
      throw error;
    }
  }

  /**
   * Get a specific guest order by ID
   */
  async getGuestOrderById(orderId) {
    try {
      const response = await fetch(`/api/orders/guest/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch guest order");
      }

      const data = await response.json();
      return data.guestOrder;
    } catch (error) {
      console.error("Error fetching guest order:", error);
      throw error;
    }
  }

  /**
   * Update guest order status
   */
  async updateGuestOrderStatus(orderId, status, notes = null) {
    try {
      const response = await fetch(`/api/orders/guest/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update guest order status"
        );
      }

      const data = await response.json();
      return data.guestOrder;
    } catch (error) {
      console.error("Error updating guest order status:", error);
      throw error;
    }
  }

  /**
   * Normalize guest order to match regular order structure
   * This helps in displaying guest orders alongside regular orders
   */
  normalizeGuestOrder(guestOrder) {
    return {
      id: guestOrder.id,
      status: guestOrder.status,
      total_amount: guestOrder.total_amount,
      created_at: guestOrder.created_at,
      updated_at: guestOrder.updated_at,
      delivery_address: guestOrder.guest_address,
      contact_number: guestOrder.guest_phone,
      // Create a buyer object from guest details
      buyer: {
        name: guestOrder.guest_name,
        email: guestOrder.guest_email,
        whatsapp_number: guestOrder.guest_phone,
        phone_number: guestOrder.guest_phone,
      },
      // Transform order_items to match regular order structure
      items:
        guestOrder.order_items?.map((item, index) => ({
          id: item.id || `guest-item-${index}`,
          quantity: item.quantity,
          price_per_unit: item.price,
          total_price: item.total,
          vegetable: {
            id: item.id,
            name: item.name,
          },
        })) || [],
      // Add seller information
      seller: guestOrder.seller,
      // Mark as guest order for special handling
      isGuestOrder: true,
      guest_notes: guestOrder.notes,
    };
  }
}

export default new GuestOrderService();
