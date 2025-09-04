"use client";

import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";
import { generateOrderStatusMessage, openWhatsApp } from "@/utils/whatsapp";

const STATUS_FLOW = {
  pending: {
    next: "confirmed",
    icon: "ti-time",
    color: "warning",
    description: "Order placed and waiting for payment",
  },
  pending_payment: {
    next: "confirmed",
    icon: "ti-credit-card",
    color: "warning",
    description: "Order placed - payment pending",
  },
  payment_received: {
    next: "confirmed",
    icon: "ti-check",
    color: "success",
    description: "Payment successful - waiting for seller confirmation",
  },
  confirmed: {
    next: "processing",
    icon: "ti-check-box",
    color: "info",
    description: "Order confirmed by seller",
  },
  processing: {
    next: "shipped",
    icon: "ti-package",
    color: "primary",
    description: "Your fresh produce is being prepared",
  },
  shipped: {
    next: "delivered",
    icon: "ti-truck",
    color: "secondary",
    description: "Order is on the way to you",
  },
  delivered: {
    next: null,
    icon: "ti-home",
    color: "success",
    description: "Order delivered successfully",
  },
  cancelled: {
    next: null,
    icon: "ti-close",
    color: "danger",
    description: "Order has been cancelled",
  },
};

export default function OrderTimeline({ order, onStatusUpdate }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);

  const isSeller = session?.user?.id === order.seller_id;
  const canUpdateStatus = isSeller && STATUS_FLOW[currentStatus]?.next;

  const handleUpdateStatus = async () => {
    const nextStatus = STATUS_FLOW[currentStatus].next;
    if (!nextStatus) return;

    setLoading(true);
    try {
      await OrderService.updateOrderStatus(order.id, nextStatus);
      setCurrentStatus(nextStatus);
      toastService.success("Order status updated to " + nextStatus);

      // Send WhatsApp notification if status has a message
      try {
        const message = generateOrderStatusMessage(order, nextStatus);
        if (message && order.contact_number) {
          openWhatsApp(order.contact_number, message);
        }
      } catch (whatsappError) {
        console.warn("WhatsApp message generation failed:", whatsappError);
        // Don't break the status update if WhatsApp fails
      }

      // Notify parent component to refresh order data
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toastService.error("Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const getTimelineItems = () => {
    // Handle cancelled orders - show simplified timeline
    if (currentStatus === "cancelled") {
      return [
        { status: "pending", state: "past" },
        { status: "cancelled", state: "active" },
      ].map(({ status, state }) => {
        const statusConfig = STATUS_FLOW[status];
        return (
          <div
            key={status}
            className={`timeline-item ${state} cancelled-order`}
          >
            <div className={`timeline-icon bg-${statusConfig.color}`}>
              <i className={statusConfig.icon}></i>
            </div>
            <div className="timeline-content">
              <h6 className="mb-1">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </h6>
              <p className="mb-0 small text-muted">
                {statusConfig.description}
              </p>
            </div>
          </div>
        );
      });
    }

    // Check if this is a free order
    const isFreeOrder = !order.total_amount || order.total_amount === 0;

    // Normal flow: show all statuses with proper visual states
    const allStatuses = [
      "pending",
      "payment_received",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    let currentWeight = getStatusWeight(currentStatus);

    // For free orders, if status is still pending, treat payment as automatically received
    if (isFreeOrder && currentStatus === "pending") {
      currentWeight = Math.max(currentWeight, 0.5); // At least payment_received level
    }

    return allStatuses.map((status) => {
      const statusConfig = STATUS_FLOW[status];
      const statusWeight = getStatusWeight(status);

      let state = "";
      let additionalClasses = "";

      if (statusWeight < currentWeight) {
        state = "past";
      } else if (statusWeight === currentWeight) {
        state = "active";
      } else {
        state = "future";
      }

      // Special handling for payment_received - show as completed for paid orders or free orders
      if (
        status === "payment_received" &&
        (currentWeight >= 0.5 || isFreeOrder)
      ) {
        state = "past"; // Show as completed
        additionalClasses = "completed-payment";
      }

      return (
        <div
          key={status}
          className={`timeline-item ${state} ${additionalClasses}`.trim()}
        >
          <div className={`timeline-icon bg-${statusConfig.color}`}>
            <i className={statusConfig.icon}></i>
          </div>
          <div className="timeline-content">
            <h6 className="mb-1">
              {status === "payment_received"
                ? "Payment Successful"
                : status.charAt(0).toUpperCase() +
                  status.slice(1).replace("_", " ")}
            </h6>
            <p className="mb-0 small text-muted">
              {getTimelineDescription(
                status,
                currentStatus,
                statusConfig.description,
                isFreeOrder
              )}
            </p>
            {state === "future" && (
              <small
                className="text-muted"
                style={{ fontSize: "11px", opacity: 0.7 }}
              >
                {getEstimatedTime(status)}
              </small>
            )}
            {state === "active" && canUpdateStatus && (
              <Button
                variant={`outline-${statusConfig.color}`}
                size="sm"
                className="mt-2"
                onClick={handleUpdateStatus}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i
                      className={`${STATUS_FLOW[statusConfig.next]?.icon} me-1`}
                    ></i>
                    Mark as {statusConfig.next}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <Card>
      <Card.Header>
        <i className="ti-time me-2"></i>
        Order Timeline
      </Card.Header>
      <Card.Body>
        <div className={`timeline progress-${currentStatus}`}>
          {getTimelineItems()}
        </div>
      </Card.Body>
    </Card>
  );
}

function getStatusWeight(status) {
  const weights = {
    pending: 0,
    payment_received: 0.5,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
  };
  return weights[status] || 0;
}

function getEstimatedTime(status) {
  const estimatedTimes = {
    confirmed: "Usually within 2-4 hours",
    processing: "1-2 days for preparation",
    shipped: "Same day or next day delivery",
    delivered: "Delivered to your doorstep",
  };
  return estimatedTimes[status] || "";
}

function getTimelineDescription(
  status,
  currentStatus,
  defaultDescription,
  isFreeOrder
) {
  // Special handling for "pending" status based on current order status
  if (status === "pending") {
    const currentWeight = getStatusWeight(currentStatus);
    // If payment has been received or order is further along, show appropriate message
    if (currentWeight >= 0.5) {
      return "Order placed successfully";
    }
  }

  // Special handling for payment_received status for free orders
  if (status === "payment_received" && isFreeOrder) {
    return "No payment required - complimentary order";
  }

  return defaultDescription;
}
