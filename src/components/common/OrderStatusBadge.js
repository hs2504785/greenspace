"use client";

import { Badge } from "react-bootstrap";

export default function OrderStatusBadge({ status, isGuestOrder = false }) {
  const getStatusConfig = (status) => {
    // Guest order specific statuses
    if (isGuestOrder) {
      const guestStatusConfig = {
        whatsapp_sent: {
          bg: "primary",
          text: "Sent via WhatsApp",
          icon: "ti-brand-whatsapp",
        },
        confirmed: {
          bg: "success",
          text: "Confirmed",
          icon: "ti-check",
        },
        processing: {
          bg: "warning",
          text: "Processing",
          icon: "ti-package",
        },
        shipped: {
          bg: "info",
          text: "Out for Delivery",
          icon: "ti-truck",
        },
        delivered: {
          bg: "success",
          text: "Delivered",
          icon: "ti-check-box",
        },
        cancelled: {
          bg: "danger",
          text: "Cancelled",
          icon: "ti-close",
        },
      };
      return (
        guestStatusConfig[status] || {
          bg: "secondary",
          text: status,
          icon: "ti-help",
        }
      );
    }

    // Regular order statuses
    const regularStatusConfig = {
      pending: {
        bg: "warning",
        text: "Pending",
        icon: "ti-clock",
      },
      payment_received: {
        bg: "success",
        text: "Payment Received",
        icon: "ti-check",
      },
      confirmed: {
        bg: "primary",
        text: "Confirmed",
        icon: "ti-check",
      },
      processing: {
        bg: "info",
        text: "Processing",
        icon: "ti-package",
      },
      shipped: {
        bg: "info",
        text: "Shipped",
        icon: "ti-truck",
      },
      delivered: {
        bg: "success",
        text: "Delivered",
        icon: "ti-check-box",
      },
      cancelled: {
        bg: "danger",
        text: "Cancelled",
        icon: "ti-close",
      },
    };

    return (
      regularStatusConfig[status] || {
        bg: "secondary",
        text: status,
        icon: "ti-help",
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <Badge bg={config.bg} className="d-flex align-items-center gap-1">
      <i className={config.icon}></i>
      {config.text}
    </Badge>
  );
}
