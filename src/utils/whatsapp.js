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
    payment_received: `Thank you for your payment! Your order #${orderId} payment has been received.\n\nOrder Details:\n${formatOrderItems(
      order.items
    )}\n\nTotal: ₹${total.toFixed(
      2
    )}\n\nDelivery Address:\n${deliveryAddress}\n\nWe'll confirm your order soon and start preparing your items.`,

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

export function generateGuestOrderMessage(items, total, guestDetails, seller) {
  // Format each item with bold product name
  const itemsMessage = items
    .map(
      (item) =>
        `*${item.name}*\n` +
        `   • Quantity: ${item.quantity} ${item.unit || "kg"}\n` +
        `   • Price: ${
          item.price === 0 ? "FREE" : `₹${item.price}/${item.unit || "kg"}`
        }\n` +
        `   • Subtotal: ₹${item.total}`
    )
    .join("\n\n");

  // Customer details section
  const customerSection =
    `*Customer Details:*\n` +
    `👤 Name: ${guestDetails.name}\n` +
    `📱 Phone: ${guestDetails.phone}\n` +
    `📧 Email: ${guestDetails.email || "Not provided"}\n` +
    `📍 Address: ${guestDetails.address}\n\n`;

  // Add divider and total
  const divider = "------------------------";
  const totalMessage = `\n${divider}\n*Total Amount: ₹${total}*`;

  // Compose the full message
  return `🛒 *New Order Request*\n\n${customerSection}${itemsMessage}${totalMessage}\n\n_Please confirm delivery details and payment method._`;
}

export function generateAuthenticatedOrderMessage(items, total, user) {
  // Format each item with bold product name
  const itemsMessage = items
    .map(
      (item) =>
        `*${item.name}*\n` +
        `   • Quantity: ${item.quantity} ${item.unit || "kg"}\n` +
        `   • Price: ${
          item.price === 0 ? "FREE" : `₹${item.price}/${item.unit || "kg"}`
        }\n` +
        `   • Subtotal: ₹${item.total}`
    )
    .join("\n\n");

  // Customer details section for authenticated users
  const customerSection =
    `*Customer Details:*\n` +
    `👤 Name: ${user.name}\n` +
    `📧 Email: ${user.email}\n` +
    `📱 Phone: ${user.phone_number || "Please ask customer"}\n\n`;

  // Add divider and total
  const divider = "------------------------";
  const totalMessage = `\n${divider}\n*Total Amount: ₹${total}*`;

  // Compose the full message
  return `🛒 *New Order Request*\n\n${customerSection}${itemsMessage}${totalMessage}\n\n_Please confirm delivery details and payment method._`;
}

export function generateExistingOrderMessage(order) {
  if (!order) {
    console.warn("WhatsApp: No order data provided");
    return "";
  }

  const orderId = order.id || "Unknown";
  const total = order.total_amount || order.total || 0;
  const deliveryAddress = order.delivery_address || "Address not available";
  const contactNumber = order.contact_number || "Contact not available";

  // Format each order item with bold product name
  const itemsMessage = (order.items || [])
    .map((item) => {
      const name = item.vegetable?.name || item.name || "Unknown item";
      const quantity = item.quantity || 0;
      const price = item.price_per_unit || item.price || 0;
      const unit = item.unit || "kg";
      const itemTotal = item.total_price || price * quantity || 0;

      return (
        `*${name}*\n` +
        `   • Quantity: ${quantity} ${unit}\n` +
        `   • Price: ${price === 0 ? "FREE" : `₹${price}/${unit}`}\n` +
        `   • Subtotal: ₹${itemTotal.toFixed(2)}`
      );
    })
    .join("\n\n");

  // Customer/Order details section
  const orderSection =
    `*Order Details:*\n` +
    `🆔 Order ID: #${orderId}\n` +
    `📦 Status: ${order.status || "Pending"}\n` +
    `📱 Contact: ${contactNumber}\n` +
    `📍 Delivery Address:\n${deliveryAddress}\n\n`;

  // Add divider and total
  const divider = "------------------------";
  const totalMessage = `\n${divider}\n*Total Amount: ₹${total.toFixed(2)}*`;

  // Compose the full message
  return `📋 *Order Information*\n\n${orderSection}${itemsMessage}${totalMessage}\n\n_Regarding the above order details._`;
}

// Farm Visit WhatsApp Messages
export function generateFarmVisitApprovalMessage(
  request,
  farmDetails,
  adminNotes = ""
) {
  if (!request) {
    console.warn("WhatsApp: No farm visit request data provided");
    return "";
  }

  const visitDate = new Date(request.requested_date).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const startTime = formatTime12Hour(request.requested_time_start);
  const endTime = formatTime12Hour(request.requested_time_end);

  const farmName = farmDetails?.farm_name || farmDetails?.name || "Our Farm";
  const farmLocation =
    farmDetails?.location ||
    farmDetails?.address ||
    "Farm location will be shared";
  const farmPhone =
    farmDetails?.phone_number ||
    farmDetails?.whatsapp_number ||
    "Contact number will be shared";

  let message = `🎉 *Farm Visit Approved!*\n\n`;
  message += `Hello ${request.visitor_name},\n\n`;
  message += `Great news! Your farm visit request has been approved.\n\n`;

  message += `*📅 Visit Details:*\n`;
  message += `🏡 Farm: ${farmName}\n`;
  message += `📅 Date: ${visitDate}\n`;
  message += `⏰ Time: ${startTime} - ${endTime}\n`;
  message += `👥 Visitors: ${request.number_of_visitors}\n\n`;

  if (request.purpose) {
    message += `*🎯 Purpose:* ${request.purpose}\n\n`;
  }

  message += `*📍 Location Details:*\n${farmLocation}\n\n`;
  message += `*📞 Farm Contact:* ${farmPhone}\n\n`;

  if (adminNotes) {
    message += `*📝 Special Instructions:*\n${adminNotes}\n\n`;
  }

  message += `*Important Notes:*\n`;
  message += `• Please arrive on time\n`;
  message += `• Carry a valid ID\n`;
  message += `• Wear comfortable clothing and closed shoes\n`;
  message += `• Follow farm safety guidelines\n\n`;

  message += `We're excited to welcome you to our farm! 🌱\n\n`;
  message += `If you have any questions, please contact us directly.`;

  return message;
}

export function generateFarmVisitRejectionMessage(
  request,
  rejectionReason = ""
) {
  if (!request) {
    console.warn("WhatsApp: No farm visit request data provided");
    return "";
  }

  const visitDate = new Date(request.requested_date).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  let message = `😔 *Farm Visit Request Update*\n\n`;
  message += `Hello ${request.visitor_name},\n\n`;
  message += `We regret to inform you that your farm visit request for ${visitDate} cannot be accommodated at this time.\n\n`;

  if (rejectionReason) {
    message += `*Reason:* ${rejectionReason}\n\n`;
  }

  message += `We encourage you to:\n`;
  message += `• Check our available dates and submit a new request\n`;
  message += `• Contact us directly for alternative arrangements\n`;
  message += `• Follow our updates for new availability\n\n`;

  message += `Thank you for your interest in visiting our farm. We hope to welcome you soon! 🌱`;

  return message;
}

export function generateFarmVisitCompletedMessage(request, farmDetails) {
  if (!request) {
    console.warn("WhatsApp: No farm visit request data provided");
    return "";
  }

  const farmName = farmDetails?.farm_name || farmDetails?.name || "Our Farm";

  let message = `🌟 *Thank You for Visiting!*\n\n`;
  message += `Hello ${request.visitor_name},\n\n`;
  message += `Thank you for visiting ${farmName} today! We hope you enjoyed your farm experience.\n\n`;

  message += `*Your feedback matters to us:*\n`;
  message += `• How was your visit experience?\n`;
  message += `• What did you learn or enjoy most?\n`;
  message += `• Any suggestions for improvement?\n\n`;

  message += `*Stay Connected:*\n`;
  message += `• Follow us for farm updates\n`;
  message += `• Book future visits\n`;
  message += `• Refer friends and family\n\n`;

  message += `We'd love to welcome you back soon! 🚜🌱`;

  return message;
}

// Helper function to format time in 12-hour format
function formatTime12Hour(timeString) {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
}

export function openWhatsApp(phoneNumber, message) {
  // Clean the message to avoid encoding issues
  const cleanMessage = message
    .replace(/[^\x00-\x7F\n\r]/g, "") // Remove non-ASCII characters but keep newlines
    .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
    .trim();

  // Clean phone number
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  const url = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(
    cleanMessage
  )}`;
  window.open(url, "_blank");
}
