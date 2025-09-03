"use client";

import { Card, Badge, Button, ProgressBar } from "react-bootstrap";

export default function ChatOrderTracker({
  order,
  onContactSeller,
  onTrackAnother,
  onViewPayment,
}) {
  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      whatsapp_sent: "info",
      confirmed: "primary",
      processing: "info",
      shipped: "success",
      delivered: "success",
      cancelled: "danger",
    };
    return colors[status] || "secondary";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      whatsapp_sent: "📱",
      confirmed: "✅",
      processing: "📦",
      shipped: "🚚",
      delivered: "🎉",
      cancelled: "❌",
    };
    return icons[status] || "📄";
  };

  const getProgressPercentage = (status) => {
    const progress = {
      pending: 10,
      whatsapp_sent: 25,
      confirmed: 40,
      processing: 60,
      shipped: 80,
      delivered: 100,
      cancelled: 0,
    };
    return progress[status] || 0;
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: "Order placed and waiting for seller confirmation",
      whatsapp_sent: "Seller has been notified via WhatsApp",
      confirmed: "Order confirmed by seller",
      processing: "Order is being prepared",
      shipped: "Order has been shipped and is on the way",
      delivered: "Order delivered successfully!",
      cancelled: "Order has been cancelled",
    };
    return messages[status] || "Unknown status";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      className="mb-3"
      style={{
        border: "2px solid #17a2b8",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(23, 162, 184, 0.15)",
      }}
    >
      <Card.Header
        style={{
          backgroundColor: "#e8f6f8",
          border: "none",
          padding: "12px 16px",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "16px", marginRight: "8px" }}>📦</span>
            <span
              className="fw-bold"
              style={{ fontSize: "14px", color: "#2d5a3d" }}
            >
              Order #{order.id.slice(-8)}
            </span>
          </div>
          <Badge bg={getStatusColor(order.status)} style={{ fontSize: "11px" }}>
            {getStatusIcon(order.status)}{" "}
            {order.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {/* Order Progress */}
        <div className="mb-3">
          <div
            className="d-flex justify-content-between align-items-center mb-2"
            style={{ fontSize: "13px" }}
          >
            <span className="fw-bold text-muted">Progress</span>
            <span className="text-muted">
              {getProgressPercentage(order.status)}%
            </span>
          </div>
          <ProgressBar
            now={getProgressPercentage(order.status)}
            variant={order.status === "cancelled" ? "danger" : "success"}
            style={{ height: "6px", borderRadius: "3px" }}
          />
        </div>

        {/* Status Message */}
        <div
          className="mb-3 p-2"
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "#2d5a3d",
              marginBottom: "4px",
            }}
          >
            Current Status
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>
            {getStatusMessage(order.status)}
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-3">
          <div className="row g-2" style={{ fontSize: "12px" }}>
            <div className="col-6">
              <strong>Order Date:</strong>
              <br />
              <span className="text-muted">{formatDate(order.created_at)}</span>
            </div>
            <div className="col-6">
              <strong>Total Amount:</strong>
              <br />
              <span
                className="text-success fw-bold"
                style={{ fontSize: "13px" }}
              >
                ₹{order.total_amount}
              </span>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        {order.seller && (
          <div
            className="mb-3 p-2"
            style={{
              backgroundColor: "#e8f5e8",
              borderRadius: "8px",
              border: "1px solid #d4edda",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#2d5a3d",
                marginBottom: "4px",
              }}
            >
              Seller Information
            </div>
            <div style={{ fontSize: "12px" }}>
              <div>
                <strong>{order.seller.name}</strong>
              </div>
              {order.seller.phone && (
                <div className="text-muted">📞 {order.seller.phone}</div>
              )}
              {order.seller.whatsapp && (
                <div className="text-muted">📱 {order.seller.whatsapp}</div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="mb-3">
            <div
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#2d5a3d",
                marginBottom: "4px",
              }}
            >
              Delivery Address
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6c757d",
                backgroundColor: "#f8f9fa",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #e9ecef",
              }}
            >
              📍 {order.delivery_address}
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-3">
            <div
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#2d5a3d",
                marginBottom: "8px",
              }}
            >
              Items Ordered
            </div>
            {order.items.map((item, index) => (
              <div
                key={index}
                className="d-flex justify-content-between"
                style={{
                  fontSize: "12px",
                  marginBottom: "4px",
                  padding: "4px 0",
                }}
              >
                <span>
                  {item.vegetable?.name || item.name} ({item.quantity}kg)
                </span>
                <span>
                  ₹{item.total_price || item.price_per_unit * item.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 flex-wrap">
          {order.seller && (
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => onContactSeller(order.seller)}
              style={{
                fontSize: "11px",
                padding: "6px 12px",
                borderRadius: "6px",
              }}
            >
              📞 Contact Seller
            </Button>
          )}

          {order.status === "pending" && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onViewPayment(order)}
              style={{
                fontSize: "11px",
                padding: "6px 12px",
                borderRadius: "6px",
              }}
            >
              💳 View Payment
            </Button>
          )}

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onTrackAnother}
            style={{
              fontSize: "11px",
              padding: "6px 12px",
              borderRadius: "6px",
            }}
          >
            📦 Track Another
          </Button>
        </div>

        {/* Additional Info */}
        <div
          className="mt-3 pt-2"
          style={{
            borderTop: "1px solid #e9ecef",
            fontSize: "11px",
            color: "#6c757d",
            textAlign: "center",
          }}
        >
          {order.status === "delivered"
            ? "🎉 Thank you for shopping with Arya Natural Farms!"
            : order.status === "cancelled"
            ? "Order cancelled. You can place a new order anytime."
            : `Last updated: ${formatDate(order.updated_at)}`}
        </div>
      </Card.Body>
    </Card>
  );
}
