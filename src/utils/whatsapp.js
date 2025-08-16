export function formatOrderItems(items) {
  if (!items || !Array.isArray(items)) {
    return "Order items not available";
  }

  return items
    .map((item) => {
      const name = item.vegetable?.name || item.name || "Unknown item";
      const quantity = item.quantity || 0;
      const price = item.price_per_unit || item.price || 0;
      const total = price * quantity;

      return `${name} - ${quantity}kg (₹${price}/kg) = ₹${total.toFixed(2)}`;
    })
    .join("\n");
}

export function generateOrderStatusMessage(order, status) {
  if (!order) {
    console.warn("WhatsApp: No order data provided");
    return "";
  }

  // Debug (remove in production)
  console.log(
    "WhatsApp: Generating message for order:",
    order.id,
    "status:",
    status
  );

  // Handle both database field names (total_amount) and expected names (total)
  const total = order.total_amount || order.total || 0;
  const orderId = order.id || "Unknown";
  const deliveryAddress = order.delivery_address || "Address not available";
  const contactNumber = order.contact_number || "Contact not available";

  const messages = {
    confirmed: `Great news! Your order #${orderId} has been confirmed.\n\nOrder Details:\n${formatOrderItems(
      order.items
    )}\n\nTotal: ₹${total.toFixed(
      2
    )}\n\nDelivery Address:\n${deliveryAddress}\n\nWe'll update you when your order is being processed.`,

    processing: `Update on order #${orderId}: We're now preparing your items!\n\nWe'll let you know once it's ready for delivery.`,

    shipped: `Your order #${orderId} is out for delivery!\n\nDelivery Address:\n${deliveryAddress}\n\nContact number: ${contactNumber}\n\nWe'll update you once it's delivered.`,

    delivered: `Order #${orderId} has been delivered! Thank you for shopping with us.\n\nIf you have any feedback or concerns, please let us know.`,

    cancelled: `Order #${orderId} has been cancelled.\n\nIf this was a mistake or you'd like to place a new order, please let us know.`,
  };

  return messages[status] || "";
}

export function generateBuyerMessage(order, type = "status") {
  const messages = {
    status: `Hi, I'm checking the status of my order #${order.id}`,
    issue: `Hi, I have an issue with my order #${order.id}`,
    delivery: `Hi, I'd like to update the delivery details for order #${order.id}:\n\nCurrent Address:\n${order.delivery_address}`,
  };

  return messages[type] || messages.status;
}

export function openWhatsApp(phoneNumber, message) {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
  window.open(url, "_blank");
}
