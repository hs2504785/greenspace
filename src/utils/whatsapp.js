export function formatOrderItems(items) {
  return items
    .map(item => `${item.vegetable.name} - ${item.quantity}kg (₹${item.price}/kg) = ₹${(item.price * item.quantity).toFixed(2)}`)
    .join('\\n');
}

export function generateOrderStatusMessage(order, status) {
  const messages = {
    confirmed: `Great news! Your order #${order.id} has been confirmed.\\n\\nOrder Details:\\n${formatOrderItems(order.items)}\\n\\nTotal: ₹${order.total.toFixed(2)}\\n\\nDelivery Address:\\n${order.delivery_address}\\n\\nWe'll update you when your order is being processed.`,
    
    processing: `Update on order #${order.id}: We're now preparing your items!\\n\\nWe'll let you know once it's ready for delivery.`,
    
    shipped: `Your order #${order.id} is out for delivery!\\n\\nDelivery Address:\\n${order.delivery_address}\\n\\nContact number: ${order.contact_number}\\n\\nWe'll update you once it's delivered.`,
    
    delivered: `Order #${order.id} has been delivered! Thank you for shopping with us.\\n\\nIf you have any feedback or concerns, please let us know.`,
    
    cancelled: `Order #${order.id} has been cancelled.\\n\\nIf this was a mistake or you'd like to place a new order, please let us know.`
  };

  return messages[status] || '';
}

export function generateBuyerMessage(order, type = 'status') {
  const messages = {
    status: `Hi, I'm checking the status of my order #${order.id}`,
    issue: `Hi, I have an issue with my order #${order.id}`,
    delivery: `Hi, I'd like to update the delivery details for order #${order.id}:\\n\\nCurrent Address:\\n${order.delivery_address}`
  };

  return messages[type] || messages.status;
}

export function openWhatsApp(phoneNumber, message) {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
