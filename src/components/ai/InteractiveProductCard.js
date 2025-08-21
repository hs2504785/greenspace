"use client";

import { useState } from "react";
import { Card, Button, Badge, Form } from "react-bootstrap";

export default function InteractiveProductCard({
  product,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await onAddToCart(product, quantity);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setLoading(true);
    try {
      await onBuyNow(product, quantity);
    } finally {
      setLoading(false);
    }
  };

  const isAvailable = product.quantity > 0;
  const maxQuantity = Math.min(product.quantity, 10); // Max 10 units per purchase

  return (
    <Card
      className="mb-3"
      style={{
        border: "2px solid #e9ecef",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.2s ease",
        maxWidth: "100%",
      }}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <h6
              className="mb-1 fw-bold"
              style={{
                color: "#2d5a3d",
                fontSize: "15px",
                lineHeight: "1.3",
              }}
            >
              {product.name}
            </h6>
            {product.description && (
              <p
                className="text-muted mb-2"
                style={{
                  fontSize: "13px",
                  lineHeight: "1.3",
                  margin: "4px 0",
                }}
              >
                {product.description.substring(0, 80)}
                {product.description.length > 80 && "..."}
              </p>
            )}
          </div>
          <Badge
            bg={isAvailable ? "success" : "secondary"}
            style={{ fontSize: "11px", marginLeft: "8px" }}
          >
            {isAvailable ? `${product.quantity}kg` : "Out of Stock"}
          </Badge>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span
              className="fw-bold"
              style={{
                fontSize: "16px",
                color: "#28a745",
              }}
            >
              ₹{product.price}/kg
            </span>
            {product.seller && (
              <div style={{ fontSize: "12px", color: "#6c757d" }}>
                📍 {product.seller.name}
              </div>
            )}
          </div>

          {isAvailable && (
            <div className="d-flex align-items-center">
              <Form.Select
                size="sm"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                style={{
                  width: "70px",
                  fontSize: "13px",
                  marginRight: "8px",
                }}
                disabled={loading}
              >
                {[...Array(maxQuantity)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}kg
                  </option>
                ))}
              </Form.Select>
            </div>
          )}
        </div>

        {isAvailable ? (
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleAddToCart}
              disabled={loading}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: "500",
              }}
            >
              {loading ? "Adding..." : "🛒 Add to Cart"}
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleBuyNow}
              disabled={loading}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: "500",
              }}
            >
              {loading ? "Processing..." : "⚡ Buy Now"}
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => onViewDetails(product)}
              style={{
                fontSize: "12px",
                padding: "6px 8px",
                textDecoration: "none",
                color: "#6c757d",
              }}
            >
              View Details
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              width: "100%",
            }}
          >
            Currently Unavailable
          </Button>
        )}

        {isAvailable && (
          <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
            Total: ₹{(product.price * quantity).toFixed(2)} for {quantity}kg
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
