"use client";

import { useState } from "react";
import { Modal, Form, Button, Alert, Card } from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";

export default function AddPaymentMethod({ show, onHide, onSuccess }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    methodType: "upi",
    upiId: "",
    accountHolderName: "",
    displayName: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateUpiId = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/;
    return upiRegex.test(upiId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate UPI ID format
      if (!validateUpiId(formData.upiId)) {
        throw new Error("Please enter a valid UPI ID (e.g., 9876543210@paytm)");
      }

      // Try to call API (may fail if not set up yet)
      try {
        const response = await fetch("/api/payments/payment-methods", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to add payment method");
        }

        toastService.success("UPI payment method added successfully!");
        onSuccess && onSuccess(result.paymentMethod);
        onHide();
        
        // Reset form
        setFormData({
          methodType: "upi",
          upiId: "",
          accountHolderName: "",
          displayName: "",
        });
      } catch (apiError) {
        console.error("API call failed:", apiError);
        
        // Show manual setup instructions if API fails
        toastService.warning("API not ready. Please use the manual database setup method.");
        
        // Show SQL instructions
        const sqlInstructions = `
-- Run this in your Supabase SQL editor after getting your seller user ID:

-- 1. Find your seller user ID:
SELECT id, name, email FROM users WHERE email = '${session?.user?.email}';

-- 2. Insert your UPI payment method (replace YOUR_USER_ID):
INSERT INTO payment_methods (
  seller_id, method_type, upi_id, account_holder_name, display_name, is_active
) VALUES (
  'YOUR_USER_ID', -- Replace with your actual user ID from step 1
  'upi',
  '${formData.upiId}',
  '${formData.accountHolderName}',
  '${formData.displayName}',
  true
);`;
        
        console.log("Manual setup SQL:", sqlInstructions);
        
        // You could also display this in a modal or copy to clipboard
        navigator.clipboard.writeText(sqlInstructions);
        toastService.info("SQL instructions copied to clipboard!");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      toastService.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti-credit-card me-2"></i>
          Add UPI Payment Method
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <i className="ti-info-alt me-2"></i>
            Configure your UPI ID to receive payments from customers.
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>UPI ID</strong> <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210@paytm"
                  required
                />
                <Form.Text className="text-muted">
                  Your UPI ID (phone@provider or name@bank)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Account Holder Name</strong> <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Full name as per bank account"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Display Name</strong> <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Arya Natural Farms UPI"
                  required
                />
                <Form.Text className="text-muted">
                  Name customers will see during payment
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>

          <Alert variant="light" className="border">
            <h6 className="mb-2">
              <i className="ti-shield me-1"></i>
              Security Note
            </h6>
            <small className="text-muted">
              Your UPI ID will be used to generate QR codes for customer payments. 
              Keep your UPI ID secure and verify all payment notifications.
            </small>
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Adding...
              </>
            ) : (
              <>
                <i className="ti-check me-2"></i>
                Add UPI Method
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
