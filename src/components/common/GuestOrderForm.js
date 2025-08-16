"use client";

import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import toastService from "@/utils/toastService";

export default function GuestOrderForm({
  show,
  onHide,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Delivery address is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toastService.error("Please fill in all required fields correctly");
      return;
    }

    // Clean phone number
    const cleanedData = {
      ...formData,
      phone: formData.phone.replace(/\D/g, ""),
    };

    onSubmit(cleanedData);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <i className="ti-user me-2 text-success"></i>
          Quick Order Details
          <i
            className="ti-help-alt ms-2 text-muted"
            style={{ fontSize: "0.9rem", cursor: "help" }}
            title="Please provide your details so the seller can contact you and arrange delivery"
          ></i>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="py-3">
          {/* Reduced padding */}

          <Row>
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  isInvalid={!!errors.name}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={7}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Phone Number <span className="text-danger">*</span>
                  <span className="text-muted ms-2 fw-normal">
                    For delivery coordination and updates
                  </span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit mobile number"
                  isInvalid={!!errors.phone}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">
              Email Address (Optional)
              <span className="text-muted ms-2 fw-normal">
                For order confirmation and updates
              </span>
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email (optional)"
              isInvalid={!!errors.email}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold">
              Delivery Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your complete delivery address with landmark"
              isInvalid={!!errors.address}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="pt-2">
          <div className="d-flex w-100 justify-content-between align-items-center">
            <small className="text-muted d-flex align-items-center">
              <i className="ti-shield text-success me-1"></i>
              <span title="Your information will only be shared with the seller for order fulfillment and delivery. We respect your privacy and won't use your details for marketing without consent.">
                Privacy protected
              </span>
            </small>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={loading}
                className="d-flex align-items-center"
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ti-comment me-2"></i>
                    Continue to WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
