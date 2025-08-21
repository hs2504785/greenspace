"use client";

import { useState } from "react";
import { Card, Button, Form, Alert, Spinner } from "react-bootstrap";

export default function QuickCheckout({
  items,
  total,
  onPlaceOrder,
  onCancel,
  user,
}) {
  const [formData, setFormData] = useState({
    deliveryAddress: user?.location || "",
    contactNumber: user?.phone || "",
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Delivery address is required";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ""))) {
      newErrors.contactNumber = "Please enter a valid 10-digit phone number";
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onPlaceOrder({
        items,
        total,
        ...formData,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="mb-3"
      style={{
        border: "2px solid #28a745",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(40, 167, 69, 0.2)",
      }}
    >
      <Card.Header
        style={{
          backgroundColor: "#e8f5e8",
          border: "none",
          padding: "12px 16px",
        }}
      >
        <div className="d-flex align-items-center">
          <span style={{ fontSize: "16px", marginRight: "8px" }}>🚀</span>
          <span
            className="fw-bold"
            style={{ fontSize: "14px", color: "#2d5a3d" }}
          >
            Quick Checkout
          </span>
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {/* Order Summary */}
        <div
          className="mb-3 p-2"
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span style={{ fontSize: "13px", fontWeight: "600" }}>
              Order Summary
            </span>
            <span style={{ fontSize: "12px", color: "#6c757d" }}>
              {items.length} item{items.length > 1 ? "s" : ""}
            </span>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="d-flex justify-content-between"
              style={{ fontSize: "12px", marginBottom: "4px" }}
            >
              <span>
                {item.name} ({item.quantity}kg)
              </span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <hr style={{ margin: "8px 0" }} />
          <div
            className="d-flex justify-content-between fw-bold"
            style={{ fontSize: "14px", color: "#28a745" }}
          >
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Information */}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label
              style={{ fontSize: "13px", fontWeight: "600", color: "#2d5a3d" }}
            >
              Full Name *
            </Form.Label>
            <Form.Control
              size="sm"
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                handleInputChange("customerName", e.target.value)
              }
              placeholder="Enter your full name"
              isInvalid={!!errors.customerName}
              style={{ fontSize: "13px" }}
            />
            {errors.customerName && (
              <div
                style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}
              >
                {errors.customerName}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label
              style={{ fontSize: "13px", fontWeight: "600", color: "#2d5a3d" }}
            >
              Email Address *
            </Form.Label>
            <Form.Control
              size="sm"
              type="email"
              value={formData.customerEmail}
              onChange={(e) =>
                handleInputChange("customerEmail", e.target.value)
              }
              placeholder="Enter your email"
              isInvalid={!!errors.customerEmail}
              style={{ fontSize: "13px" }}
            />
            {errors.customerEmail && (
              <div
                style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}
              >
                {errors.customerEmail}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label
              style={{ fontSize: "13px", fontWeight: "600", color: "#2d5a3d" }}
            >
              Phone Number *
            </Form.Label>
            <Form.Control
              size="sm"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) =>
                handleInputChange("contactNumber", e.target.value)
              }
              placeholder="Enter 10-digit phone number"
              isInvalid={!!errors.contactNumber}
              style={{ fontSize: "13px" }}
            />
            {errors.contactNumber && (
              <div
                style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}
              >
                {errors.contactNumber}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label
              style={{ fontSize: "13px", fontWeight: "600", color: "#2d5a3d" }}
            >
              Delivery Address *
            </Form.Label>
            <Form.Control
              size="sm"
              as="textarea"
              rows={2}
              value={formData.deliveryAddress}
              onChange={(e) =>
                handleInputChange("deliveryAddress", e.target.value)
              }
              placeholder="Enter complete delivery address"
              isInvalid={!!errors.deliveryAddress}
              style={{ fontSize: "13px", resize: "none" }}
            />
            {errors.deliveryAddress && (
              <div
                style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}
              >
                {errors.deliveryAddress}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label
              style={{ fontSize: "13px", fontWeight: "600", color: "#2d5a3d" }}
            >
              Special Instructions (Optional)
            </Form.Label>
            <Form.Control
              size="sm"
              as="textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any special delivery instructions..."
              style={{ fontSize: "13px", resize: "none" }}
            />
          </Form.Group>
        </Form>

        {/* Payment Info */}
        <Alert
          variant="info"
          className="mb-3"
          style={{
            fontSize: "12px",
            padding: "8px 12px",
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "8px",
          }}
        >
          <strong>Payment:</strong> After placing your order, you'll receive a
          UPI QR code for payment. Simply scan with any UPI app (GPay, PhonePe,
          Paytm) to complete your purchase.
        </Alert>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            style={{
              fontSize: "12px",
              padding: "8px 16px",
              borderRadius: "8px",
              flex: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              fontSize: "12px",
              padding: "8px 16px",
              borderRadius: "8px",
              flex: 2,
            }}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Placing Order...
              </>
            ) : (
              "Place Order ₹" + total.toFixed(2)
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
