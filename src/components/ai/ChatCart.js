"use client";

import { useState } from "react";
import { Card, Button, ListGroup, Badge, Form } from "react-bootstrap";

export default function ChatCart({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
}) {
  const [loading, setLoading] = useState(false);

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await onCheckout(cartItems);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card
        className="mb-3"
        style={{
          border: "2px solid #e9ecef",
          borderRadius: "12px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Card.Body className="text-center py-4">
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🛒</div>
          <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
            Your cart is empty
          </p>
          <Button
            variant="outline-success"
            size="sm"
            onClick={onContinueShopping}
            style={{
              fontSize: "12px",
              padding: "6px 16px",
              borderRadius: "8px",
            }}
          >
            Continue Shopping
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card
      className="mb-3"
      style={{
        border: "2px solid #28a745",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(40, 167, 69, 0.15)",
      }}
    >
      <Card.Header
        className="d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "#e8f5e8",
          border: "none",
          padding: "12px 16px",
        }}
      >
        <div className="d-flex align-items-center">
          <span style={{ fontSize: "16px", marginRight: "8px" }}>🛒</span>
          <span
            className="fw-bold"
            style={{ fontSize: "14px", color: "#2d5a3d" }}
          >
            Shopping Cart
          </span>
        </div>
        <Badge bg="success" style={{ fontSize: "11px" }}>
          {calculateItemCount()} items
        </Badge>
      </Card.Header>

      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {cartItems.map((item, index) => (
            <ListGroup.Item
              key={`${item.id}-${index}`}
              className="px-3 py-2"
              style={{ border: "none", borderBottom: "1px solid #f0f0f0" }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6
                    className="mb-1"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#2d5a3d",
                    }}
                  >
                    {item.name}
                  </h6>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    ₹{item.price}/kg • {item.seller?.name || "Unknown Seller"}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Form.Select
                    size="sm"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(item.id, parseInt(e.target.value))
                    }
                    style={{
                      width: "65px",
                      fontSize: "11px",
                    }}
                  >
                    {[...Array(Math.min(item.availableQuantity || 10, 10))].map(
                      (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}kg
                        </option>
                      )
                    )}
                  </Form.Select>

                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      fontSize: "16px",
                      padding: "2px 6px",
                      color: "#dc3545",
                      textDecoration: "none",
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>

              <div
                className="text-end mt-1"
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                ₹{(item.price * item.quantity).toFixed(2)}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <div className="px-3 py-3" style={{ backgroundColor: "#f8f9fa" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span
              className="fw-bold"
              style={{ fontSize: "16px", color: "#2d5a3d" }}
            >
              Total
            </span>
            <span
              className="fw-bold"
              style={{ fontSize: "18px", color: "#28a745" }}
            >
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={onContinueShopping}
              style={{
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                flex: 1,
              }}
            >
              Continue Shopping
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleCheckout}
              disabled={loading}
              style={{
                fontSize: "12px",
                padding: "8px 16px",
                borderRadius: "8px",
                flex: 2,
              }}
            >
              {loading ? "Processing..." : "🚀 Checkout"}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
